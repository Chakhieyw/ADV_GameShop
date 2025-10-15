import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-add-game',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './add-game.html',
  styleUrls: ['./add-game.scss'],
})
export class AddGame {
  name: string = '';
  price: string = '';
  type: string = '';
  detail: string = '';
  releaseDate: string = ''; // ✅ เราจะตั้งค่าอัตโนมัติใน ngOnInit()
  file?: File;

  constructor(
    private firestore: Firestore,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // ✅ ตั้งค่าวันที่อัตโนมัติเป็นวันนี้ (รูปแบบ YYYY-MM-DD)
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    this.releaseDate = `${yyyy}-${mm}-${dd}`;
  }

  onFileSelected(event: any) {
    this.file = event.target.files[0];
  }

  async saveGame() {
    if (!this.name || !this.price || !this.type) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน ❌');
      return;
    }

    try {
      let imageUrl = '';
      

      if (this.file) {
        imageUrl = await this.auth.uploadToCloudinary(this.file);
      }

      await addDoc(collection(this.firestore, 'games'), {
        name: this.name,
        price: this.price,
        type: this.type,
        detail: this.detail,
        // ✅ ใช้วันที่ที่ตั้งค่าไว้ (อัตโนมัติ)
        releaseDate: this.releaseDate,
        imageUrl,
        sold: 0,
        createdAt: new Date(),
      });

      alert('✅ เพิ่มเกมสำเร็จ!');
      this.router.navigate(['/admin/manage-game']);
    } catch (err) {
      console.error(err);
      alert('❌ เกิดข้อผิดพลาดในการบันทึก');
    }
  }

  cancel() {
    this.router.navigate(['/admin/manage-game']);
  }

  async logout() {
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
}
