import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-edit-discount',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, RouterLink],
  templateUrl: './edit-discount.html',
  styleUrls: ['./edit-discount.scss'],
})
export class EditDiscountPage implements OnInit {
  id!: string;
  code = '';
  percent: number | null = null;
  limit: number | null = null;

  constructor(
    private firestore: Firestore,
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService
  ) {}

  async ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id') || '';
    if (this.id) {
      await this.loadDiscount();
    } else {
      alert('❌ ไม่พบรหัสส่วนลดที่ต้องการแก้ไข');
      this.router.navigate(['/admin/discount']);
    }
  }

  async loadDiscount() {
    try {
      const ref = doc(this.firestore, 'discounts', this.id);
      const snapshot = await getDoc(ref);

      if (snapshot.exists()) {
        const data: any = snapshot.data();
        this.code = data.code;
        this.percent = data.percent;
        this.limit = data.limit;
      } else {
        alert('❌ ไม่พบข้อมูลส่วนลด');
        this.router.navigate(['/admin/discount']);
      }
    } catch (err) {
      console.error(err);
      alert('⚠️ เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
    }
  }

  async onSave() {
    if (!this.code || this.percent === null || this.limit === null) {
      alert('⚠️ กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (this.percent < 0 || this.percent > 100) {
      alert('⚠️ ส่วนลดต้องอยู่ระหว่าง 0 - 100%');
      return;
    }

    if (this.limit < 0) {
      alert('⚠️ จำนวนคูปองต้องมากกว่าหรือเท่ากับ 0');
      return;
    }

    try {
      const ref = doc(this.firestore, 'discounts', this.id);
      await updateDoc(ref, {
        code: this.code,
        percent: this.percent,
        limit: this.limit,
      });

      alert('✅ บันทึกการแก้ไขสำเร็จ');
      this.router.navigate(['/admin/discount']);
    } catch (err) {
      console.error(err);
      alert('❌ เกิดข้อผิดพลาดในการบันทึก');
    }
  }

  onCancel() {
    this.router.navigate(['/admin/discount']);
  }
  async logout() {
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
}
