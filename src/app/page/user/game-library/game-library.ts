import { Component, OnInit, signal } from '@angular/core';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-game-library',
  imports: [CommonModule, RouterLink],
  templateUrl: './game-library.html',
  styleUrl: './game-library.scss'
})
export class GameLibrary implements OnInit{
  myGames = signal<any[]>([]);
  loading = signal(true);

  constructor(
    private firestore: Firestore,
    private auth: AuthService,
    private router: Router,
  ) {}

  async ngOnInit() {
    await this.loadMyGames();
  }

  async loadMyGames() {
  try {
    const user = this.auth.getUserFromSession();
    if (!user) return;

    const querySnapshot = await getDocs(collection(this.firestore, 'mygames'));
    const list: any[] = [];

    querySnapshot.forEach((snap) => {
      const data = snap.data();
      if (data['userId'] === user.uid) {
        list.push({ id: snap.id, ...data });
      }
    });

    // ✅ เรียงตามเวลาที่ซื้อ (ล่าสุดอยู่บนสุด)
    list.sort((a, b) => {
      const timeA = a.purchasedAt?.toMillis ? a.purchasedAt.toMillis() : 0;
      const timeB = b.purchasedAt?.toMillis ? b.purchasedAt.toMillis() : 0;
      return timeA - timeB; // เรียงจากเก่า → ใหม่
    });

    this.myGames.set(list);
    console.log('🎮 My games loaded (sorted):', list);
  } catch (err) {
    console.error('Failed to load my games:', err);
  } finally {
    this.loading.set(false);
  }
}


  // ฟังก์ชันไปหน้ารายละเอียดเกม (ยังไม่ต้องทำจริง ถ้ามีจะเพิ่มภายหลัง)
  viewDetail(game: any) {
    console.log('ดูรายละเอียดเกม:', game.name);
    this.router.navigate(['/user/game-detail', game.gameId]);
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
