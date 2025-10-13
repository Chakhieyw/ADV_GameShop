import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';
import {
  Firestore,
  collection,
  getDocs,
  doc,
  getDoc,
} from '@angular/fire/firestore';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterModule],
  templateUrl: './admin-home.html',
  styleUrls: ['./admin-home.scss'],
})
export class AdminHome implements OnInit, OnDestroy {
  constructor(
    private auth: AuthService,
    private router: Router,
    private firestore: Firestore,
    private cdr: ChangeDetectorRef, // ✅ เพิ่ม
    private ngZone: NgZone // ✅ เพิ่มตรงนี้
  ) {
    if (!this.auth.isLoggedIn()) this.router.navigate(['/login']);
  }

  allGames: any[] = [];
  categories: { name: string; games: any[] }[] = [];
  topGames: any[] = [];
  slides: any[] = [];
  currentSlide = 0;
  slideInterval: any;
  searchText = '';
  selectedCategory = '';

  async ngOnInit() {
    await this.loadAllGames(); // โหลดเกมทั้งหมด
    await this.loadTopGamesFromMyGames(); // โหลด 5 อันดับยอดขายสูงสุด

    if (this.slides.length > 0) {
      this.slideInterval = setInterval(() => this.nextSlide(), 3000);
    }
  }

  ngOnDestroy() {
    clearInterval(this.slideInterval);
  }

  /** ✅ โหลดเกมทั้งหมดจาก games */
  async loadAllGames() {
    const querySnapshot = await getDocs(collection(this.firestore, 'games'));
    const list: any[] = [];
    querySnapshot.forEach((snap) => list.push({ id: snap.id, ...snap.data() }));
    this.allGames = list;

    // ✅ Group ตามประเภท
    const grouped: { [key: string]: any[] } = {};
    list.forEach((g) => {
      const type = g.type || 'อื่นๆ';
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(g);
    });
    this.categories = Object.keys(grouped).map((key) => ({
      name: key,
      games: grouped[key],
    }));
  }

  /** ✅ โหลด 5 อันดับเกมขายดีจาก mygames */
  async loadTopGamesFromMyGames() {
    try {
      const colRef = collection(this.firestore, 'mygames');
      const snapshot = await getDocs(colRef);

      const countMap = new Map<string, number>();

      snapshot.forEach((docSnap) => {
        const data: any = docSnap.data();
        const gameId = data['gameId'];
        if (gameId) {
          countMap.set(gameId, (countMap.get(gameId) || 0) + 1);
        }
      });

      const result: any[] = [];
      for (const [gameId, sales] of countMap.entries()) {
        const gameRef = doc(this.firestore, 'games', gameId);
        const gameSnap = await getDoc(gameRef);
        if (gameSnap.exists()) {
          result.push({ id: gameId, sales, ...gameSnap.data() });
        }
      }

      this.topGames = result.sort((a, b) => b.sales - a.sales).slice(0, 5);

      this.slides = this.topGames.map((g) => ({
        image:
          g['imageUrl'] ||
          'https://placehold.co/900x250/94a3b8/ffffff?text=No+Image',
        name: g['name'],
        price: g['price'],
        type: g['type'] || 'อื่นๆ',
      }));

      console.log('✅ Top Games:', this.topGames);

      // 👇 เพิ่มบรรทัดนี้เพื่อบังคับให้ Angular render ใหม่
      this.cdr.detectChanges();
    } catch (error) {
      console.error('🔥 โหลด 5 อันดับเกมขายดีล้มเหลว:', error);
    }
  }

  /** ✅ ฟังก์ชันค้นหา */
  applyFilter() {
    const text = this.searchText.toLowerCase();
    const cat = this.selectedCategory;
    this.categories.forEach((c) => {
      c.games = this.allGames.filter(
        (g) =>
          (!text || g.name.toLowerCase().includes(text)) &&
          (!cat || g.type === cat)
      );
    });
  }

  goDetail(id: string) {
    this.router.navigate(['/admin/detail-game', id]);
  }

  async onLogout() {
    await this.auth.logout();
    this.router.navigate(['/login']);
  }

  nextSlide() {
    this.ngZone.run(() => {
      this.currentSlide = (this.currentSlide + 1) % this.slides.length;
      this.cdr.detectChanges(); // ✅ บังคับ render ใหม่
    });
  }

  prevSlide() {
    this.ngZone.run(() => {
      this.currentSlide =
        (this.currentSlide - 1 + this.slides.length) % this.slides.length;
      this.cdr.detectChanges();
    });
  }

  goToSlide(i: number) {
    this.ngZone.run(() => {
      this.currentSlide = i;
      this.cdr.detectChanges();
    });
  }
}
