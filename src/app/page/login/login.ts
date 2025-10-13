import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class Login {
  email = signal('');
  password = signal('');

  constructor(private auth: AuthService, private router: Router) {}

  async ngOnInit() {
    // ✅ ถ้าเคยล็อกอินอยู่แล้ว ให้ redirect ไปหน้า role ของเขาเลย
    const isLoggedIn = await this.auth.waitForAuthCheck();
    if (isLoggedIn) {
      const user = this.auth.getUserFromSession();
      console.log('🔹 พบ session เดิม:', user);

      if (user.role === 'admin') {
        this.router.navigate(['/admin/home']);
      } else if (user.role === 'user') {
        this.router.navigate(['/user/home']);
      }
    }
  }

  async onLogin(e: Event) {
    e.preventDefault();

    const emailValue = this.email().trim();
    const passwordValue = this.password().trim();

    if (!emailValue || !passwordValue) {
      alert('กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      alert('อีเมลไม่ถูกต้อง ✉️');
      return;
    }

    try {
      // 🔹 ล็อกอินผ่าน Firebase + ดึงข้อมูลจาก Firestore
      const userData = await this.auth.login(emailValue, passwordValue);
      if (!userData) throw new Error('ไม่สามารถเข้าสู่ระบบได้');

      console.log('👤 ข้อมูลผู้ใช้:', userData);

      // 🔹 รองรับเฉพาะ role
      const role = userData.role;

      if (userData.role === 'admin') {
        this.router.navigate(['/admin/home']);
      } else if (userData.role === 'user') {
        this.router.navigate(['/user/home']);
      } else {
        alert('ไม่พบสิทธิ์ของผู้ใช้ ❌');
      }
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        alert('ไม่พบบัญชีผู้ใช้นี้ ❌');
      } else if (
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-email' ||
        err.code === 'auth/invalid-credential'
      ) {
        alert('อีเมลหรือรหัสผ่านไม่ถูกต้อง ❌');
      } else {
        alert(`เกิดข้อผิดพลาด: ${err.message}`);
      }
    }
  }
}
