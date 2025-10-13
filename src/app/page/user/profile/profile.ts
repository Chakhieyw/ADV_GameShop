import { Component, input, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OnInit } from '@angular/core';
import { NgModule } from '@angular/core';
import { HistoryService, HistoryItem } from '../../../core/services/history';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class Profile implements OnInit {
  username = signal('');
  email = signal('');
  file?: File;
  previewUrl = signal<string | null>(null);
  money = signal<number>(0);

  // สำหรับแก้ไข inline - มีเฉพาะ username
  editingUsername = signal(false);
  usernameInput = '';
  history = signal<HistoryItem[]>([]);
  loading = signal(true);

  constructor(
    private auth: AuthService,       // ✅ ใช้ดึงข้อมูลผู้ใช้ session
    private historyService: HistoryService, // ✅ ใช้ดึงประวัติ
    private router: Router           // ✅ ใช้ redirect / navigation
  ) {}

  showDialog = signal(false);
  selectedAmount = signal<number | null>(null);
  customAmount = signal(false);
  inputAmount = signal('');


  isProcessing = false; // ✅ ตัวแปรสถานะโหลด

  // เปิด Dialog
  addMoney() {
  this.showDialog.set(true);
  this.selectedAmount.set(null);
  this.customAmount.set(false);
  this.inputAmount.set('');
}



  // ปิด Dialog
  closeDialog() {
    this.showDialog.set(false);
  }

  // เลือกจำนวนเงิน
  selectAmount(amount: number | 'custom') {
    if (amount === 'custom') {
      this.customAmount.set(true);
      this.selectedAmount.set(null);
      this.inputAmount.set('');
    } else {
      this.customAmount.set(false);
      this.selectedAmount.set(amount);
      this.inputAmount.set(amount.toString());
    }
  }

  // ยืนยันการเติมเงิน (คุณสามารถเชื่อม API ตรงนี้ได้)
  async confirmTopup() {
    if (this.customAmount() && this.inputAmount() === '') {
      alert('กรุณากรอกจำนวนเงิน');
      return;
    }

    const amount = Number(this.customAmount() ? this.inputAmount() : this.selectedAmount());
    if (isNaN(amount) || amount <= 0) {
      alert('กรุณากรอกจำนวนเงินที่ถูกต้อง');
      return;
    }

    if (amount > 100000) {
      alert('ระบบจำกัดการเติมเงินสูงสุดที่ 100,000 บาท ❌');
      return;
    }

    if (this.isProcessing) return;
    this.isProcessing = true;
  

    const user = this.auth.getUserFromSession();
    if (!user) {
      alert('ไม่พบข้อมูลผู้ใช้ในระบบ ❌');
      this.isProcessing = false;
      return;
    }

    this.loading.set(true);

    try {
      // ✅ ให้ auth จัดการเพิ่มยอดเอง
      await this.auth.updateUser(user.uid, {}, amount);

      await this.auth.addTopupHistory(user.uid, amount);

      // ✅ อัปเดต signal ตาม session ล่าสุด
      const updatedUser = await this.auth.fetchUser(user.uid);
    // อัปเดต signal
    this.money.set(updatedUser['money'] || 0);

      const items = await this.historyService.getUserHistory(user.uid);
  this.history.set(items);

      alert(`เติมเงินจำนวน ${amount} บาท สำเร็จ!`);
       this.closeDialog();
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการเติมเงิน ❌');
    } finally {
      this.isProcessing = false;
      this.loading.set(false);
    }
}


   //ใช้ isLoggedIn()
  async ngOnInit() {
  if (!this.auth.isLoggedIn()) {
    console.log('Not logged in, redirecting to login');
    this.router.navigate(['/login']);
    return;
  } 
  const user = await this.auth.waitForSessionUser(); // ✅

    console.log('User from session:', user.username);
    if (!user.username) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      // ✅ ดึงข้อมูลล่าสุดจาก Firestore
      const latestUser = await this.auth.fetchUser(user.uid);
      const items = await this.historyService.getUserHistory(user.uid);
      this.history.set(items);
      // อัปเดต signal
      this.username.set(latestUser['username']);
      this.email.set(latestUser['email']); // ✅ อีเมลแสดงเฉยๆ
      this.previewUrl.set(latestUser['profileUrl'] || null);
      this.money.set(latestUser['money'] || 0);

      // อัปเดต input fields สำหรับ inline edit
      this.usernameInput = latestUser['username'];

      // sync localStorage ให้ตรงกับ Firestore
      localStorage.setItem('user', JSON.stringify(latestUser));
    } catch (err) {
      console.error('ไม่สามารถดึงข้อมูลผู้ใช้จาก Firestore ได้', err);
      // ถ้า fetch ไม่ได้ ให้ logout ออกไปหน้า login
      this.auth.logout();
      this.router.navigate(['/login']);
    }finally {
      this.loading.set(false);
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
