import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Firestore,
  doc,
  getDoc,
  collection,
  getDocs,
  docData,
  collectionData,
} from '@angular/fire/firestore';
import { AuthService } from '../../../core/services/auth';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-detail-game',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './detail-game.html',
  styleUrls: ['./detail-game.scss'],
})
export class DetailGamePage implements OnInit {
  game$!: Observable<any>;
  topGames$!: Observable<any[]>;

  constructor(
    private firestore: Firestore,
    private route: ActivatedRoute,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    // ✅ โหลดข้อมูลเกมแบบ real-time ไม่ต้องรอ await
    const gameRef = doc(this.firestore, 'games', id!);
    this.game$ = docData(gameRef, { idField: 'id' });

    // ✅ โหลด top 5 เกมขายดีทันที
    const colRef = collection(this.firestore, 'games');
    this.topGames$ = collectionData(colRef, { idField: 'id' });
  }
  formatThaiDate(dateInput: any): string {
    if (!dateInput) return '-';
    const date = dateInput.seconds
      ? new Date(dateInput.seconds * 1000) // ถ้าเป็น Timestamp จาก Firestore
      : new Date(dateInput);

    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  loadGame(id: string) {
    const ref = doc(this.firestore, 'games', id);
    this.game$ = docData(ref, { idField: 'id' });
  }

  // ✅ โหลด Top 5 เกมขายดีแบบไม่ต้องรอ await
  loadTopGames() {
    const colRef = collection(this.firestore, 'games');
    this.topGames$ = collectionData(colRef, { idField: 'id' });
  }

  // ✅ ปุ่มเพิ่มในตะกร้า
  onBuy(game: any) {
    alert(`🛒 เพิ่ม "${game.name}" ลงในตะกร้าเรียบร้อย`);
  }

  async logout() {
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
  goToDetail(gameId: string) {
    this.router.navigate(['/admin/detail', gameId]).then(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}
