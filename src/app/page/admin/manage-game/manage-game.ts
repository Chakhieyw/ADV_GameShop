import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
@Component({
  selector: 'app-manage-game',
  standalone: true,
  imports: [CommonModule, RouterLink  ],
  templateUrl: './manage-game.html',
  styleUrls: ['./manage-game.scss']
})
export class ManageGame{
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
   async onLogout() {
    try {
      await this.auth.logout();
      this.router.navigate(['/login']);
    } catch (err) {
      console.error('Logout failed', err);
    }
  }
  games = [
    { name: 'Game name', price: 199, category: 'Racing', releaseDate: '9/9/2568' },
    { name: 'Game name', price: 199, category: 'Racing', releaseDate: '9/9/2568' },
    { name: 'Game name', price: 199, category: 'Racing', releaseDate: '9/9/2568' },
    { name: 'Game name', price: 199, category: 'Racing', releaseDate: '9/9/2568' },
    { name: 'Game name', price: 199, category: 'Racing', releaseDate: '9/9/2568' },
  ];
}
