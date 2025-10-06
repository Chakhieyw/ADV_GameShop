import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');

    // ✅ ถ้าไม่มีข้อมูลผู้ใช้ (เช่น logout แล้ว)
    if (!user) {
      alert('กรุณาเข้าสู่ระบบก่อน ❌');
      this.router.navigate(['/login']);
      return false;
    }

    // ✅ อนุญาตเฉพาะ admin เข้า
    if (user.role === 'admin') {
      return true;
    }

    alert('คุณไม่มีสิทธิ์เข้าหน้านี้ ❌');
    this.router.navigate(['/user/home']);
    return false;
  }
}
