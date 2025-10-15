import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Firestore, collection, doc, getDoc, getDocs } from '@angular/fire/firestore';
import { AuthService } from '../../../core/services/auth';
import { DatePipe } from '@angular/common';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-game-detail',
  standalone: true,
  imports: [CommonModule,RouterLink],
  templateUrl: './game-detail.html',
  styleUrls: ['./game-detail.scss'],
  providers: [DatePipe]
})
export class GameDetailComponent {
  game = signal<any>(null);
  user = signal<any>(null); // ข้อมูล user ล่าสุด
  ownedGames = signal<any[]>([]); // เกมที่ผู้ใช้ซื้อแล้ว

  constructor(
    private route: ActivatedRoute,
    private firestore: Firestore,
    private router: Router,
    private auth: AuthService
  ) {
    this.loadGameDetail();
    this.loadOwnedGames();
  }

  async loadGameDetail() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    const ref = doc(this.firestore, 'games', id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      this.game.set({ id: snap.id, ...snap.data() });
      console.log('🎮 Loaded game:', this.game());
    }
  }


  // โหลดเกมที่เป็นของผู้ใช้
async loadOwnedGames() {
  const userData = this.auth.getUserFromSession();
  if (!userData) return;

  try {
    const querySnapshot = await getDocs(collection(this.firestore, 'mygames'));
    const list: any[] = [];
    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data['userId'] === userData.uid) {
        // map ให้มี field gameId
        list.push({
          id: docSnap.id, // id ของ mygames document
          gameId: data['gameId'], // id ของเกม
          ...data
        });
      }
    });
    this.ownedGames.set(list);
    console.log('Owned games:', list);
  } catch (err) {
    console.error('Failed to load owned games', err);
  }
}


// เช็คว่าเกมเป็นของผู้ใช้
 isGameOwned(gameId: string) {
  return this.ownedGames().some(g => g.gameId === gameId);
}


 addToCartAndReturn(game: any) {
  // ถ้าเกมยังไม่ owned
  if (!this.isGameOwned(game.id)) {
    // โหลด cart จาก localStorage
    const cartStr = localStorage.getItem('cartItems') || '[]';
    const cart: any[] = JSON.parse(cartStr);

    // ถ้าเกมยังไม่มีใน cart ให้เพิ่ม
    if (!cart.some(g => g.id === game.id)) {
      cart.push(game);
      localStorage.setItem('cartItems', JSON.stringify(cart));
    }
  }

  // บันทึก flag ให้เปิด dialog ตอนกลับหน้า home
  localStorage.setItem('openCartDialog', 'true');

  // กลับไปหน้า user/home
  this.router.navigate(['/user/home']);
}



  goBack() {
      window.history.back();
    }
  async onLogout() {
    try {
      await this.auth.logout();
      this.router.navigate(['/login']);
    } catch (err) {
      console.error('Logout failed', err);
    }
  }
}
