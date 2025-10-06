import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-home',
  imports: [RouterLink, CommonModule],
  templateUrl: './admin-home.html',
  styleUrl: './admin-home.scss',
})
export class AdminHome implements OnInit, OnDestroy {
  constructor(private auth: AuthService, private router: Router) {
    //  // ✅ วิธีที่ 1: ใช้ isLoggedIn()

    if (!this.auth.isLoggedIn()) {
      console.log('Not logged in, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }
    const user = this.auth.getUserFromSession();
    console.log('User from session:', user.username);
    if (!user.username) {
      this.router.navigate(['/login']);
      return;
    }
  }

  ngOnInit() {
    // เริ่ม auto slide
    this.slideInterval = setInterval(() => this.nextSlide(), 3000);

        // ✅ ตรวจสอบการล็อกอิน
      if (!this.auth.isLoggedIn()) {
        this.router.navigate(['/login']);
        alert('กรุณาทำการล็อกอินก่อนเข้าใช้งาน');
        return;
      }

      const user = this.auth.getUserFromSession();
      
      // ✅ ตรวจสอบว่าเป็น admin
      if (user.userType !== 'admin') {
        console.log('Access denied: User is not admin');
        this.router.navigate(['/user/home']);
        alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
        return;
      }

      console.log('Admin user:', user.username, 'Type:', user.userType);
      // ... โค้ดต่อไป
  }

  async onLogout() {
    try {
      await this.auth.logout();
      this.router.navigate(['/login']);
    } catch (err) {
      console.error('Logout failed', err);
    }
  }
  categories = [
    { name: 'FPS', games: Array(5).fill({ name: 'Game Name', price: 119 }) },
    {
      name: 'Action RPG',
      games: Array(5).fill({ name: 'Game Name', price: 129 }),
    },
    { name: 'Racing', games: Array(5).fill({ name: 'Game Name', price: 139 }) },
    {
      name: 'Dungeon Crawling',
      games: Array(5).fill({ name: 'Game Name', price: 149 }),
    },
  ];

  topGames = [
    { name: 'Game A', price: 199 },
    { name: 'Game B', price: 229 },
    { name: 'Game C', price: 259 },
    { name: 'Game D', price: 289 },
    { name: 'Game E', price: 319 },
  ];
  currentSlide = 0;
  slideInterval: any;

  slides = [
    { image: 'https://via.placeholder.com/600x250/94a3b8/ffffff?text=Game+1' },
    { image: 'https://via.placeholder.com/600x250/64748b/ffffff?text=Game+2' },
    { image: 'https://via.placeholder.com/600x250/475569/ffffff?text=Game+3' },
  ];

  ngOnDestroy() {
    clearInterval(this.slideInterval);
  }

  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }

  prevSlide() {
    this.currentSlide =
      (this.currentSlide - 1 + this.slides.length) % this.slides.length;
  }

  goToSlide(index: number) {
    this.currentSlide = index;
  }
}
