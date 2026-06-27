import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { publicGuard } from './core/guards/public.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'signup',
    pathMatch: 'full',
  },
  {
    path: 'signup',
    canActivate: [publicGuard],
    loadComponent: () =>
      import('./features/auth/signup/signup.component').then(
        (m) => m.SignupComponent,
      ),
  },
  {
    path: 'login',
    canActivate: [publicGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/profile/profile.component').then((m) => m.ProfileComponent),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    canDeactivate: [(c: any) => c.canDeactivate ? c.canDeactivate() : true],
    loadComponent: () =>
      import('./features/settings/settings').then((m) => m.Settings),
  },
  {
    path: 'traffic-dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/traffic-dashboard/traffic-dashboard-page.component').then(
        (m) => m.TrafficDashboardPageComponent,
      ),
  },
  {
    path: 'air-quality-dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/air-quality/air-quality-page.component').then((m) => m.AirQualityPageComponent),
  },
  {
    path: 'street-light-dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/street-light/street-light-page.component').then((m) => m.StreetLightPageComponent),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(
        (m) => m.NotFoundComponent,
      ),
  },
];