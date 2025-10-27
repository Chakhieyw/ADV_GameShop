import { Routes } from '@angular/router';
import { Login } from './page/login/login';
import { Register } from './page/register/register';
import { UserHome } from './page/user/user-home/user-home';
import { AdminHome } from './page/admin/admin-home/admin-home';
import { Profile } from './page/user/profile/profile';
import { ManageGame } from './page/admin/manage-game/manage-game';
import { AdminGuard } from './core/services/admin.guard';
import { UserGuard } from './core/services/user.guard';
import { AddGame } from './page/admin/add-game/add-game';
import { EditGame } from './page/admin/edit-game/edit-game';
import { GameLibrary } from './page/user/game-library/game-library';
import { Component } from '@angular/core';
import { GameDetailComponent } from './page/user/game-detail/game-detail';
import { DiscountPage } from './page/admin/discount/discount';
import { DetailGamePage } from './page/admin/detail-game/detail-game';


export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'user/home', component: UserHome, canActivate: [UserGuard] },
  { path: 'admin/home', component: AdminHome, canActivate: [AdminGuard] },
  {
    path: 'admin/manage-game',
    component: ManageGame,
    canActivate: [AdminGuard],
  },
  { path: 'admin/add-game', component: AddGame, canActivate: [AdminGuard] },
  {
    path: 'admin/edit-game/:id',
    component: EditGame,
    canActivate: [AdminGuard],
  },
  {
    path: 'admin/detail-game/:id',
    component: DetailGamePage,
    canActivate: [AdminGuard],
  },
  {
    path: 'admin/discount',
    component: DiscountPage,
    canActivate: [AdminGuard],
  },
  { path: 'user/profile', component: Profile, canActivate: [UserGuard] },
  {
    path: 'user/game-library',
    component: GameLibrary,
    canActivate: [UserGuard],
  },
  {
    path: 'user/game-detail/:id',
    component: GameDetailComponent,
    canActivate: [UserGuard],
  },

  { path: '**', redirectTo: 'login' },
];
