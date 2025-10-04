import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.scss'],
})
export class Register {
  username = signal('');
  email = signal('');
  password = signal('');
  file?: File;
  userType = signal<'user' | 'admin'>('user');

  constructor(private auth: AuthService, private router: Router) {}

  onFileSelected(event: any) {
    this.file = event.target.files[0];
  }

  async onRegister(e: Event) {
    e.preventDefault();

    const emailValue = this.email().trim();

    // ✅ ตรวจรูปแบบอีเมลก่อน
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      alert('กรุณากรอกอีเมลให้ถูกต้อง เช่น example@gmail.com ✉️');
      return;
    }

    try {
      await this.auth.register(
        this.username(),
        emailValue,
        this.password(),
        this.file
      );

      alert('สมัครสมาชิกสำเร็จ 🎉');
      this.router.navigate(['/login']); // ✅ ไปหน้า login ทันที
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        alert('อีเมลนี้ถูกใช้ไปแล้ว กรุณาใช้อีเมลอื่นครับ ✉️');
      } else if (err.code === 'auth/invalid-email') {
        alert('อีเมลไม่ถูกต้อง กรุณากรอกใหม่ครับ ✉️');
      } else {
        alert('เกิดข้อผิดพลาด: ' + err.message);
      }
    }
  }

  selectType(type: 'user' | 'admin') {
    this.userType.set(type);
  }
}
