import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-edit-game',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: 'edit-game.html',
  styleUrls: ['edit-game.scss'],
})
export class EditGame implements OnInit {
  id: string = '';
  name: string = '';
  price: string = '';
  type: string = '';
  detail: string = '';
  releaseDate: string = '';
  imageUrl: string = '';
  file?: File;
  isLoading = true;

  constructor(
    private firestore: Firestore,
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService
  ) {}

  async ngOnInit() {
    // ✅ ดึง ID จาก URL
    this.id = this.route.snapshot.paramMap.get('id') || '';

    if (!this.id) {
      alert('ไม่พบ ID ของเกม ❌');
      this.router.navigate(['/admin/manage-game']);
      return;
    }

    try {
      const ref = doc(this.firestore, 'games', this.id);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        alert('ไม่พบข้อมูลเกมนี้ ❌');
        this.router.navigate(['/admin/manage-game']);
        return;
      }

      const data = snap.data() as any;
      this.name = data.name;
      this.price = data.price;
      this.type = data.type;
      this.detail = data.detail;
      this.releaseDate = data.releaseDate;
      this.imageUrl = data.imageUrl;
    } catch (e) {
      console.error(e);
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล ❌');
    } finally {
      this.isLoading = false;
    }
  }

  onFileSelected(event: any) {
    this.file = event.target.files[0];
  }

  async saveChanges() {
    try {
      if (!this.name || !this.price || !this.type) {
        alert('กรุณากรอกข้อมูลให้ครบถ้วน ❌');
        return;
      }

      let newImageUrl = this.imageUrl;
      if (this.file) {
        newImageUrl = await this.auth.uploadToCloudinary(this.file);
      }

      const ref = doc(this.firestore, 'games', this.id);
      await updateDoc(ref, {
        name: this.name,
        price: this.price,
        type: this.type,
        detail: this.detail,
        releaseDate: this.releaseDate,
        imageUrl: newImageUrl,
      });

      alert('✅ อัปเดตข้อมูลสำเร็จ!');
      this.router.navigate(['/admin/manage-game']);
    } catch (e) {
      console.error(e);
      alert('❌ อัปเดตไม่สำเร็จ');
    }
  }

  cancel() {
    this.router.navigate(['/admin/manage-game']);
  }
  logout() {
    this.router.navigate(['/login']);
  }
}
