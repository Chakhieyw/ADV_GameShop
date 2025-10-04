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
  styleUrls: ['./login.scss']
})
export class Login {
  email = signal('');
  password = signal('');

  constructor(private auth: AuthService, private router: Router) {}

  async onLogin(e: Event) {
    e.preventDefault();

    const emailValue = this.email().trim();
    const passwordValue = this.password().trim();

    if (!emailValue || !passwordValue) {
      alert('กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน');
      return;
    }

    try {
      const userData = await this.auth.login(emailValue, passwordValue);
      alert(`ยินดีต้อนรับ ${userData['username']} 🎮`);
      this.router.navigate(['/catalog']); // ไปหน้า Catalog หรือ Dashboard
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        alert('ไม่พบบัญชีผู้ใช้นี้ ❌');
      } else if (err.code === 'auth/wrong-password') {
        alert('รหัสผ่านไม่ถูกต้อง ❌');
      } else if (err.code === 'auth/invalid-email') {
        alert('อีเมลไม่ถูกต้อง ❌');
      } else {
        alert('เกิดข้อผิดพลาด: ' + err.message);
      }
    }
  }
}
