import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class UserGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');

    // ✅ ถ้าไม่มีข้อมูลผู้ใช้ (เช่น logout แล้ว)
    if (!user) {
      alert('กรุณาเข้าสู่ระบบก่อน ❌');
      this.router.navigate(['/login']);
      return false;
    }

    // ✅ ถ้า role เป็น user ถึงจะเข้าได้
    if (user.role === 'user') {
      return true;
    }

    alert('คุณไม่มีสิทธิ์เข้าหน้านี้ ❌');
    this.router.navigate(['/admin/home']);
    return false;
  }
}
