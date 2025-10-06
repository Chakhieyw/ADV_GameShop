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

  async ngOnInit() {
    // ✅ ใช้ waitForAuthCheck() เพื่อรอให้ auth state พร้อม
    const isLoggedIn = await this.auth.waitForAuthCheck();
    
    if (isLoggedIn) {
      console.log('ล็อกอินอยู่แล้ว กำลังล้าง session...');
      
      // ✅ ล็อกเอาท์ให้หมดจริงๆ
      await this.auth.logout();
      
      // ✅ รอให้ Firebase อัพเดท state
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('✅ Session cleared, ready for new login');
    }
  }

  async onLogin(e: Event) {
    e.preventDefault();

    const emailValue = this.email().trim();
    const passwordValue = this.password().trim();

    console.log('🧩 Email:', emailValue);
    console.log('🔑 Password:', passwordValue);


    if (!emailValue || !passwordValue) {
      alert('กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน');
      return;
    }

    // ✅ ตรวจสอบรูปแบบอีเมลก่อนส่ง
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      alert('อีเมลไม่ถูกต้อง ✉️');
      return;
    }

    try {
      // ✅ login ผ่าน Firebase และดึงข้อมูลจาก Firestore
      const userData = await this.auth.login(emailValue, passwordValue);
      if (!userData) throw new Error('ไม่สามารถเข้าสู่ระบบได้');

      alert(`ยินดีต้อนรับ ${userData.username} 🎮`);
      this.router.navigate(['/user/home']);

    } catch (err: any) {
      // ✅ จัดการ error แบบละเอียด
      // const msgMap: Record<string, string> = {
      //   'auth/user-not-found': 'ไม่พบบัญชีผู้ใช้นี้ ❌',
      //   'auth/wrong-password': 'รหัสผ่านไม่ถูกต้อง ❌',
      //   'auth/invalid-email': 'อีเมลไม่ถูกต้อง ❌',
      //   'auth/invalid-credential': 'ข้อมูลรับรองไม่ถูกต้อง ❌',
      // };

      // const msg = msgMap[err.code] || `เกิดข้อผิดพลาด: ${err.message}`;
      // alert(msg);
      if (err.code === 'auth/user-not-found') {
        alert('ไม่พบบัญชีผู้ใช้นี้ ❌');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-email' || err.code === 'auth/invalid-credential') {
        alert('อีเมลหรือรหัสผ่านไม่ถูกต้อง ❌');
      }
     
    }
  }
}
