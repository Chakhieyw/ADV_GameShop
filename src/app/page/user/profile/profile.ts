import { Component, input, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OnInit } from '@angular/core';
import { NgModule } from '@angular/core';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class Profile implements OnInit {
  username = signal('');
  email = signal('');
  file?: File;
  previewUrl = signal<string | null>(null);

  // สำหรับแก้ไข inline - มีเฉพาะ username
  editingUsername = signal(false);
  usernameInput = '';

  constructor(private auth: AuthService, private router: Router) {}

   //ใช้ isLoggedIn()
  async ngOnInit() {
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
      console.log('Access denied: User is not User');
      this.router.navigate(['/admin/home']);
      alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
      return;
    }

    console.log('User:', user.username, 'Type:', user.userType);
    // ... โค้ดต่อไป

    try {
      // ✅ ดึงข้อมูลล่าสุดจาก Firestore
      const latestUser = await this.auth.fetchUser(user.uid);

      // อัปเดต signal
      this.username.set(latestUser['username']);
      this.email.set(latestUser['email']); // ✅ อีเมลแสดงเฉยๆ
      this.previewUrl.set(latestUser['profileUrl'] || null);

      // อัปเดต input fields สำหรับ inline edit
      this.usernameInput = latestUser['username'];

      // sync localStorage ให้ตรงกับ Firestore
      localStorage.setItem('user', JSON.stringify(latestUser));
    } catch (err) {
      console.error('ไม่สามารถดึงข้อมูลผู้ใช้จาก Firestore ได้', err);
      // ถ้า fetch ไม่ได้ ให้ logout ออกไปหน้า login
      this.auth.logout();
      this.router.navigate(['/login']);
    }
  }

  toggleEditUsername() {
    this.editingUsername.set(!this.editingUsername());
    this.usernameInput = this.username();
  }

  // ✅ บันทึกชื่อผู้ใช้ใหม่
  async saveUsername() {
    const user = this.auth.getUserFromSession();
    if (!user) return;

    try {
      await this.auth.updateUser(user.uid, { username: this.usernameInput });
      this.username.set(this.usernameInput);
      this.editingUsername.set(false);
      alert('บันทึกชื่อผู้ใช้สำเร็จ ✅');
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการบันทึก ❌');
    }
  }

  async onLogout() {
    try {
      await this.auth.logout();
      this.router.navigate(['/login']);
    } catch (err) {
      console.error('Logout failed', err);
    }
  }

  async onFileSelected(event: any) {
    const file = event.target.files?.[0];
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.file = input.files[0];
      
      if (!file) return;
    }
    try {
      // เรียกไปที่ service ที่เพิ่มไว้
      const newUrl = await this.auth.updateProfilePicture(file);

      // เปลี่ยนภาพในหน้าให้ทันที
      this.previewUrl.set(newUrl);
      alert('✅ เปลี่ยนรูปโปรไฟล์เรียบร้อยแล้ว!');
    } catch (err) {
      console.error(err);
      alert('❌ ไม่สามารถอัปโหลดรูปได้');
    }
  }
}
