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
  role = signal('user');

  constructor(private auth: AuthService, private router: Router) {}
  previewUrl = signal<string | null>(null);

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.file = input.files[0];

      // ✅ แสดง preview รูป
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl.set(reader.result as string);
      };
      reader.readAsDataURL(this.file);
    }
  }

  async onRegister(e: Event) {
    e.preventDefault();

    if (!this.username() && !this.email() && !this.password() && !this.file) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    if (!this.username().trim()) {
      alert('กรุณากรอกชื่อผู้ใช้งาน');
      return;
    }

    if (!this.email().trim()) {
      alert('กรุณากรอกอีเมล');
      return;
    }

    if (!this.password().trim()) {
      alert('กรุณากรอกรหัสผ่าน');
      return;
    }

    if (!this.file) {
      alert('กรุณาแนบรูปโปรไฟล์');
      return;
    }

    const emailValue = this.email().trim();

    // ✅ ตรวจรูปแบบอีเมลก่อน
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      alert('กรุณากรอกอีเมลให้ถูกต้อง เช่น example@gmail.com ✉️');
      return;
    }

    try {
      // สมัครสมาชิก
      const userCredential = await this.auth.register(
        this.username(),
        emailValue,
        this.password(),
        this.file
      );

      // เก็บข้อมูลลง Firebase DB
      // สมมติว่า auth.register คืนค่า userCredential ที่มี user.uid
      await this.auth.saveUserToDB({
        uid: userCredential.user.uid,
        username: this.username(),
        email: emailValue,
        role: this.role(),
        profileUrl: userCredential.profileUrl || null, // ถ้ามี url รูป
      });

      alert('สมัครสมาชิกสำเร็จ 🎉');
      this.router.navigate(['/login']);
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
  selectRole(role: 'user' | 'admin') {
    this.role.set(role);
  }
}
