import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class UserGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!user) {
      alert('กรุณาเข้าสู่ระบบก่อน ❌');
      this.router.navigate(['/login']);
      return false;
    }

    if (user.role === 'user') {
      return true;
    }

    alert('คุณไม่มีสิทธิ์เข้าหน้านี้ ❌');
    this.router.navigate(['/admin/home']);
    return false;
  }
}
