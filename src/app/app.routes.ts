import { Routes } from '@angular/router';
import { Login } from './page/login/login';
import { Register } from './page/register/register';
import { UserHome } from './page/user/user-home/user-home';
import { AdminHome } from './page/admin/admin-home/admin-home';
import { Profile } from './page/user/profile/profile';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'user/home', component: UserHome },
  { path: 'admin/home', component: AdminHome },
  { path: 'user/profile', component: Profile },

  { path: '**', redirectTo: 'login' },
];
