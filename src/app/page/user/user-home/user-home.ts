import { Component } from '@angular/core';
import { AuthService } from '../../../core/services/auth';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-user-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './user-home.html',
  styleUrl: './user-home.scss'
})
export class UserHome {

  constructor(private auth: AuthService, private router: Router) {
    //  // ✅ วิธีที่ 1: ใช้ isLoggedIn()
  if (!this.auth.isLoggedIn()) {
    console.log('Not logged in, redirecting to login');
    this.router.navigate(['/login']);
    alert('กรุณาทำการล็อกอินก่อนเข้าใช้งาน');
    return;
  } 
    const user = this.auth.getUserFromSession();
    console.log('User from session:', user.username);
    
    // ✅ ตรวจสอบว่าเป็น admin
    if (user.userType !== 'user') {
      console.log('Access denied: User is not user');
      this.router.navigate(['/admin/home']);
      alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
      return;
    }

    console.log('User:', user.username, 'Type:', user.userType);
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


}
