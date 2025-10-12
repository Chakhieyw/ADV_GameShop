import { Component, OnInit, signal } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth';
@Component({
  selector: 'app-discount',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, RouterModule],
  templateUrl: './discount.html',
  styleUrls: ['./discount.scss'],
})
export class DiscountPage implements OnInit {
  discounts$ = signal<any[]>([]);
  isLoading = signal(false);

  constructor(
    private firestore: Firestore,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.loadDiscounts();
  }

  // ✅ โหลดข้อมูลจาก Firestore
  async loadDiscounts() {
    const colRef = collection(this.firestore, 'discounts');
    const snapshot = await getDocs(colRef);

    const list = snapshot.docs.map((docSnap) => {
      const data: any = docSnap.data();
      return { id: docSnap.id, ...data };
    });

    // ✅ ตรวจสอบถ้าคูปองหมด (limit <= 0) ให้ปิดสถานะอัตโนมัติ
    for (const item of list) {
      if (item.limit <= 0 && item.status === 'active') {
        await updateDoc(doc(this.firestore, 'discounts', item.id), {
          status: 'inactive',
        });
        item.status = 'inactive'; // อัปเดตในหน้า UI ด้วย
      }
    }

    this.discounts$.set(list);
  }

  onEdit(d: any) {
    this.router.navigate(['/admin/edit-discount', d.id]);
  }

  async onDelete(id: string) {
    if (confirm('❗ ต้องการลบโค้ดส่วนลดนี้หรือไม่')) {
      await deleteDoc(doc(this.firestore, 'discounts', id));
      alert('✅ ลบสำเร็จ');
      this.loadDiscounts();
    }
  }

  // ✅ ปุ่มเพิ่ม
  goAdd() {
    this.router.navigate(['/admin/add-discount']);
  }

  // ✅ ปุ่มลบ
  async deleteDiscount(id: string) {
    if (confirm('คุณต้องการลบโค้ดส่วนลดนี้ใช่หรือไม่?')) {
      await deleteDoc(doc(this.firestore, 'discounts', id));
      alert('ลบโค้ดส่วนลดเรียบร้อย');
      this.loadDiscounts();
    }
  }

  // ✅ ปุ่มแก้ไข
  editDiscount(id: string) {
    this.router.navigate(['/admin/edit-discount', id]);
  }
  async logout() {
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
}
