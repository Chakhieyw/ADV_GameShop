import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Firestore,
  collection,
  getDocs,
  doc,
  getDoc,
  orderBy,
  query,
  collectionData,
} from '@angular/fire/firestore';
import { RouterModule, Route, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { combineLatest, map, Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth';

interface User {
  id: string;
  username?: string;
  email?: string;
  role?: string;
}

interface History {
  id: string;
  userId: string;
  amount: number;
  note: string;
  timestamp: any;
}

@Component({
  selector: 'app-history-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './history-admin.html',
  styleUrls: ['./history-admin.scss'],
})
export class HistoryAdmin implements OnInit {
  histories$: Observable<any[]> | undefined;
  users$: Observable<any[]> | undefined;

  constructor(private firestore: Firestore, private router: Router, private auth: AuthService) {}

  async ngOnInit() {
    await this.loadHistory();
  }

  loadHistory(): void {
    // ✅ ใช้ collectionData เพื่ออยู่ใน Angular Zone
    const historyRef = collection(this.firestore, 'history');
    const historyQuery = query(historyRef, orderBy('timestamp', 'desc'));
    const userRef = collection(this.firestore, 'users');

    const histories$ = collectionData(historyQuery, { idField: 'id' });
    const users$ = collectionData(userRef, { idField: 'id' });

    // ✅ รวมข้อมูล history + user ในฝั่ง client
    this.histories$ = combineLatest([
      histories$ as Observable<History[]>,
      users$ as Observable<User[]>,
    ]).pipe(
      map(([histories, users]) =>
        histories.map((h) => {
          const user = users.find((u) => u.id === h.userId);
          return {
            ...h,
            username: user?.username || user?.email || 'ไม่พบข้อมูลผู้ใช้',
          };
        })
      )
    );
  }
  formatDate(timestamp: any): string {
    if (!timestamp) return '-';
    const d = new Date(timestamp.seconds * 1000);
    return `วันที่ ${d.getDate()}/${d.getMonth() + 1}/${
      d.getFullYear() + 543
    } : ${d.toLocaleTimeString('th-TH')}`;
  }
  async logout() {
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
}
