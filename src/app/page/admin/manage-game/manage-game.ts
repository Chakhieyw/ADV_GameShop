import { Component, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
@Component({
  selector: 'app-manage-game',
  standalone: true,
  imports: [CommonModule, RouterLink  ],
  templateUrl: './manage-game.html',
  styleUrls: ['./manage-game.scss']
})
export class ManageGame implements OnInit {
  constructor(private auth: AuthService, private router: Router) {
    //  // ✅ วิธีที่ 1: ใช้ isLoggedIn()

    if (!this.auth.isLoggedIn()) {
      console.log('Not logged in, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }
    const user = this.auth.getUserFromSession();
    console.log('User from session:', user.username);
    if (!user.username) {
      this.router.navigate(['/login']);
      return;
    }
  }
  ngOnInit(): void {
    // ✅ ตรวจสอบการล็อกอิน
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      alert('กรุณาทำการล็อกอินก่อนเข้าใช้งาน');
      return;
    }

    const user = this.auth.getUserFromSession();
    
    // ✅ ตรวจสอบว่าเป็น admin
    if (user.userType !== 'admin') {
      console.log('Access denied: User is not admin');
      this.router.navigate(['/user/home']);
      alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
      return;
    }

    console.log('Admin user:', user.username, 'Type:', user.userType);
    // ... โค้ดต่อไป
  }
   async onLogout() {
    try {
      await this.auth.logout();
      this.router.navigate(['/login']);
    } catch (err) {
      console.error('Logout failed', err);
    }
  }
  games = [
    { name: 'Game name', price: 199, category: 'Racing', releaseDate: '9/9/2568' },
    { name: 'Game name', price: 199, category: 'Racing', releaseDate: '9/9/2568' },
    { name: 'Game name', price: 199, category: 'Racing', releaseDate: '9/9/2568' },
    { name: 'Game name', price: 199, category: 'Racing', releaseDate: '9/9/2568' },
    { name: 'Game name', price: 199, category: 'Racing', releaseDate: '9/9/2568' },
  ];
}
