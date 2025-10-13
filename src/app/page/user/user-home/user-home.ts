import { Component, signal, OnInit, computed } from '@angular/core';
import { AuthService } from '../../../core/services/auth';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { CommonModule ,} from '@angular/common';

import { FormsModule } from '@angular/forms';
import { GameService } from '../../../core/services/game_service';
import { HistoryService } from '../../../core/services/history';

@Component({
  selector: 'app-user-home',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './user-home.html',
  styleUrls: ['./user-home.scss'],
})
export class UserHome implements OnInit {
  user = signal<any>(null); // ข้อมูล user ล่าสุด
  allGames = signal<any[]>([]); // เกมทั้งหมด
  totalGames = signal<string>('0.00'); // จำนวนเกมทั้งหมด
  fpsGames = signal<any[]>([]); // เกมแนว FPS
  rpgGames = signal<any[]>([]); // เกมแนว RPG
  mobaGames = signal<any[]>([]); // เกมแนว MOBA
  racingGames = signal<any[]>([]); // เกมแนว Racing
  dungeonGames = signal<any[]>([]); // เกมแนว Dungeon
  cartItems = signal<any[]>([]); // รายการสินค้าในตะกร้า
  showCart = signal(false);
  discounts = signal<any[]>([]); // รายการคูปองจาก Firestore
  ownedGames = signal<any[]>([]); // เกมที่ผู้ใช้ซื้อแล้ว
  selectedDiscount = signal<any | null>(null); // คูปองที่เลือกไว้
  cartItemsList: any[] = [];
  categories = ['Moba','Racing','RPG','FPS','Dungeon']; // ประเภทเกม
  searchResults: any[] = [];   // ผลลัพธ์การค้นหา
  searchText: string = '';      // ชื่อเกม
  selectedType: string = '';    // ประเภทเกม
  isSearching: boolean = false; // อยู่ในโหมดค้นหา
  

  constructor(
    private auth: AuthService,
    private router: Router,
    private firestore: Firestore,
    private gameService: GameService,
    private historyService: HistoryService,
  ) {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
    }
  }


  
  // Getter อ่านอย่างเดียว
  showCartDialog() {
    return this.showCart();
  }

  // ฟังก์ชันเปิด dialog
  openCartDialog() {
    this.showCart.set(true);
  }

  // ฟังก์ชันปิด dialog
  closeCartDialog() {
    this.showCart.set(false);
  }

  ngOnInit() {
  this.init();
}

async init() {
  await this.loadUser();      // รอให้ user โหลดเสร็จก่อน
  await this.loadOwnedGames(); // ตอนนี้ user() มีค่าแล้ว
  await this.loadGames();
  await this.loadDiscounts();
}



// เรียกเมื่อกดปุ่ม Search
performSearch() {
  console.log(this.searchText);
  console.log(this.selectedType);
  
  if (this.searchText == '' && this.selectedType == '') {
    this.clearSearch();
    return;
  }
  let results = this.allGames();

  if (this.searchText.trim()) {
    const text = this.searchText.toLowerCase();
    results = results.filter(g => g.name && g.name.toLowerCase().includes(text));
  }

  if (this.selectedType) {
    results = results.filter(g => g.type && g.type === this.selectedType);
  }

  this.searchResults = results;
  this.isSearching = true;
}


// ล้างผลการค้นหา
clearSearch() {
  this.searchText = '';
  this.selectedType = '';
  this.searchResults = [];
  this.isSearching = false;
}



// โหลด discounts
async loadDiscounts() {
  try {
    const querySnapshot = await getDocs(collection(this.firestore, 'discounts'));
    const list: any[] = [];
    querySnapshot.forEach((snap) => list.push({ id: snap.id, ...snap.data() }));
    this.discounts.set(list.filter(d => d.status === 'active')); // ใช้เฉพาะ active
    console.log('Discounts loaded:', this.discounts());
  } catch (err) {
    console.error('Failed to load discounts', err);
  }
}

  // โหลดข้อมูล user ล่าสุดจาก Firestore
  async loadUser() {
    try {
      const sessionUser = this.auth.getUserFromSession();
      const latestUser = await this.auth.fetchUser(sessionUser.uid);
      this.user.set(latestUser);
    } catch (err) {
      console.error('Failed to load user', err);
      this.router.navigate(['/login']);
    }
  }

  async loadOwnedGames() {
    const userData = this.user();
    if (!userData) return;

    try {
      const querySnapshot = await getDocs(collection(this.firestore, 'mygames'));
      const list: any[] = [];
      querySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data['userId'] === userData.uid) list.push(data);
      });
      this.ownedGames.set(list);
      console.log('Owned games:', list);
    } catch (err) {
      console.error('Failed to load owned games', err);
    }
  }


  // โหลดเกมทั้งหมด
  async loadGames() {
    try {
      const querySnapshot = await getDocs(collection(this.firestore, 'games'));
      const list: any[] = [];
      querySnapshot.forEach((snap) => list.push({ id: snap.id, ...snap.data() }));
      this.allGames.set(list);
      this.fpsGames.set(list.filter(g => g.type === 'FPS'));
      this.rpgGames.set(list.filter(g => g.type === 'RPG'));
      this.mobaGames.set(list.filter(g => g.type === 'Moba'));
      this.racingGames.set(list.filter(g => g.type === 'Racing'));
      this.dungeonGames.set(list.filter(g => g.type === 'Dungeon'));

      console.log('Games loaded:', list);
    } catch (err) {
      console.error('Failed to load games', err);
    }
  }
  
 isGameOwned(gameId: string) {
  return this.ownedGames().some(g => g.gameId === gameId);
}


  // ดึงเกมตามประเภท
 getGamesByCategory(category: string) {
  const games = this.allGames() || [];
  return games.filter(game => game.category === category);
}
// toggle เพิ่ม/ลบจากตะกร้า
toggleCart(game: any) {
  if (this.isGameOwned(game.id)) {
    alert('คุณมีเกมนี้แล้ว ❌');
    return;
  }

  const current = this.cartItems();
  const exists = current.find(g => g.id === game.id);
  if (exists) {
    this.cartItems.set(current.filter(g => g.id !== game.id));
  } else {
    this.cartItems.set([...current, game]);
  }
}
// ตรวจสอบว่าเกมอยู่ในตะกร้า
isInCart(game: any) {
  return this.cartItems().some(g => g.id === game.id);
}
// ลบเกมจาก cart (dialog ใช้ trash)
removeFromCart(game: any) {
  this.cartItems.set(this.cartItems().filter(g => g.id !== game.id));
}
// คำนวณราคาทั้งหมด
totalCartPrice = computed(() => 
  this.cartItems().reduce((sum, g) => sum + g.price, 0)
);
// จำนวนรายการ
cartCount() {
  return this.cartItems().length;
}

// ชำระเงิน
async checkout() {
  const userData = this.user();
  if (!userData) return;

  const total = this.finalPrice();

  if (this.cartItems().length <= 0 ) {
    alert('กรุณาเลือกซื้อเกมก่อน');
    return;
  }
  // เช็กเงินเพียงพอไหม
  if (userData.money < total) {
    alert('ยอดเงินในบัญชีไม่พอ กรุณาเติมเงิน');
    console.log('Checkout failed: เงินไม่พอ', {
      userId: userData.uid,
      userMoney: userData.money,
      required: total
    });
    return;
  }

  // Confirm dialog
  const confirmMsg = this.selectedDiscount()
    ? `คุณยืนยันที่จะซื้อเกมโดยใช้คูปอง ${this.selectedDiscount().code} หรือไม่?`
    : 'คุณยืนยันที่จะซื้อเกมนี้หรือไม่?';

  if (!confirm(confirmMsg)) {
    console.log('Checkout cancelled by user');
    return;
  }

  try {
    // 1️⃣ ตัดเงินผู้ใช้
    console.log('Updating user money...', {
      userId: userData.uid,
      oldMoney: userData.money,
      newMoney: userData.money - total
    });
    await this.gameService.updateUserMoney(userData.uid, userData.money - total);
    console.log('User money updated successfully');

    for (let game of this.cartItems()) {
      // เพิ่มลง ownedGames ทันที
      this.ownedGames.set([...this.ownedGames(), {
        userId: userData.uid,
        gameId: game.id,  
        name: game.name,
        imageUrl: game.imageUrl,
        price: game.price,
        purchasedAt: new Date()
      }]);
    }


    // 2️⃣ บันทึกประวัติ + เพิ่มเกม
    for (let game of this.cartItems()) {
      console.log('Adding history for game:', game);
      await this.historyService.addHistory(userData.uid, {
        type: 'purchase',
        gameId: game.id,
        gameName: game.name,
        amount: game.price,
        discountUsed: this.selectedDiscount()?.code || null
      });
      console.log('History added for game:', game.id);

      console.log('Adding game to mygames:', game);
      await this.gameService.addMyGame(userData.uid, game);
      console.log('Game added to mygames:', game.id);

      await this.gameService.increaseSoldCount(game.id);
      console.log('update game sold success');
    }
    
    // 3️⃣ ลดคูปอง
    if (this.selectedDiscount()) {
      console.log('Decreasing coupon count:', this.selectedDiscount().id);
      await this.gameService.decreaseCouponCount(this.selectedDiscount().id);
      console.log('Coupon count decreased:', this.selectedDiscount().id);
    }

    // 4️⃣ รีเซ็ต cart และ discount
    this.cartItems.set([]);
    this.selectedDiscount.set(null);
    this.closeCartDialog();
    console.log('Cart and discount reset');

    // 5️⃣ โหลดข้อมูลผู้ใช้ล่าสุด
    await this.loadUser();
    console.log('User data reloaded');

    alert('ซื้อเกมเรียบร้อยแล้ว ✅');

  } catch (err) {
    console.error('Checkout failed at some step:', err);
    alert('เกิดข้อผิดพลาดในการซื้อเกม');
  }
}

// ฟังก์ชันเลือกส่วนลด
onDiscountChange(selectedId: string) {
  const discount = this.discounts().find(d => d.id === selectedId);
  this.selectedDiscount.set(discount || null);
}

// คำนวณส่วนลดอัตโนมัติ
discountAmount = computed(() => {
  const discount = this.selectedDiscount();
  const total = this.cartItems().reduce((sum, g) => sum + g.price, 0);
  return discount ? (discount.percent / 100) * total : 0;
});

// ราคาสุทธิอัตโนมัติ
finalPrice = computed(() => this.cartItems().reduce((sum, g) => sum + g.price, 0) - this.discountAmount());



  async onLogout() {
    try {
      await this.auth.logout();
      this.router.navigate(['/login']);
    } catch (err) {
      console.error('Logout failed', err);
    }
  }
}
