import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    // ✅ เปลี่ยนจาก sessionStorage → localStorage
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!user) {
      alert('กรุณาเข้าสู่ระบบก่อน ❌');
      this.router.navigate(['/login']);
      return false;
    }

    // ✅ ตรวจ role
    if (user.role === 'admin') {
      return true;
    }

    alert('คุณไม่มีสิทธิ์เข้าหน้านี้ ❌');
    this.router.navigate(['/user/home']);
    return false;
  }
}
