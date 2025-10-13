import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterModule],
  templateUrl: './admin-home.html',
  styleUrls: ['./admin-home.scss'],
})
export class AdminHome implements OnInit, OnDestroy {
  constructor(
    private auth: AuthService,
    private router: Router,
    private firestore: Firestore
  ) {
    if (!this.auth.isLoggedIn()) this.router.navigate(['/login']);
  }

  allGames: any[] = [];
  categories: { name: string; games: any[] }[] = [];
  topGames: any[] = [];
  searchText = '';
  selectedCategory = '';
  slides: any[] = [];
  currentSlide = 0;
  slideInterval: any;
  showModal = false;
  selectedGame: any = null;

  async ngOnInit() {
    await this.loadGames();
    if (this.slides.length > 0) {
      this.slideInterval = setInterval(() => this.nextSlide(), 3000);
    }
  }

  ngOnDestroy() {
    clearInterval(this.slideInterval);
  }

  async loadGames() {
    const querySnapshot = await getDocs(collection(this.firestore, 'games'));
    const list: any[] = [];
    querySnapshot.forEach((snap) => list.push({ id: snap.id, ...snap.data() }));
    this.allGames = list;

    // ✅ Top 5 เกมขายดี
    this.topGames = [...list].sort((a, b) => b.price - a.price).slice(0, 5);

    // ✅ Slides 5 เกมขายดี
    this.slides = this.topGames.map((g) => ({
      image: g.imageUrl || 'https://via.placeholder.com/900x250?text=No+Image',
      name: g.name,
      price: g.price,
      type: g.type || 'อื่นๆ',
    }));

    // ✅ Group ตามประเภทเกม
    const grouped: { [key: string]: any[] } = {};
    list.forEach((g) => {
      const type = g.type || 'อื่นๆ';
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(g);
    });
    this.categories = Object.keys(grouped).map((key) => ({
      name: key,
      games: grouped[key],
    }));
  }

  async onLogout() {
    await this.auth.logout();
    this.router.navigate(['/login']);
  }

  applyFilter() {
    const text = this.searchText.toLowerCase();
    const cat = this.selectedCategory;
    this.categories.forEach((c) => {
      c.games = c.games.filter(
        (g) =>
          (!text || g.name.toLowerCase().includes(text)) &&
          (!cat || g.type === cat)
      );
    });
  }
  goDetail(id: string) {
    this.router.navigate(['/admin/detail-game', id]);
  }

  openModal(game: any) {
    this.selectedGame = game;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedGame = null;
  }

  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }

  prevSlide() {
    this.currentSlide =
      (this.currentSlide - 1 + this.slides.length) % this.slides.length;
  }

  goToSlide(i: number) {
    this.currentSlide = i;
  }
}
