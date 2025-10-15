import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router,RouterModule } from '@angular/router';
import { Firestore, collection, addDoc, serverTimestamp } from '@angular/fire/firestore';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-add-discount',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterModule],
  templateUrl: './add-discount.html',
  styleUrls: ['./add-discount.scss'],
})
export class AddDiscount {
  code = '';
  percent: number | null = null;
  limit: number | null = null;

  constructor(private firestore: Firestore, private router: Router, private auth: AuthService) {}

  async addDiscount() {
    try {
      const discountCol = collection(this.firestore, 'discounts');
      await addDoc(discountCol, {
        code: this.code,
        percent: this.percent,
        limit: this.limit,
        status: 'active',
        createdAt: serverTimestamp(),
      });
      alert('✅ เพิ่มโค้ดส่วนลดเรียบร้อยแล้ว!');
      this.router.navigate(['/admin/discount']);
    } catch (err) {
      console.error(err);
      alert('❌ เกิดข้อผิดพลาดในการเพิ่มข้อมูล');
    }
  }

   async logout() {
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
}
