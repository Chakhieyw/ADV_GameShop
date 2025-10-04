import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouterOutlet, RouterLink } from '@angular/router';
import { appConfig } from './app/app.config';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  template: `
    <nav class="p-4 bg-sky-600 text-white flex gap-4 items-center">
      <h1 class="font-bold text-lg">🎮 GameShop</h1>
      <a routerLink="/catalog">Catalog</a>
      <span class="flex-1"></span>
      <button class="bg-green-500 px-3 py-1 rounded">Wallet</button>
    </nav>

    <main class="p-4">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [
    `
      nav a {
        color: white;
        text-decoration: none;
      }
      nav a:hover {
        text-decoration: underline;
      }
    `,
  ],
})
export class RootComponent {}

bootstrapApplication(RootComponent, appConfig).catch((err) =>
  console.error(err)
);
