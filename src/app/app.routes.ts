import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'signup',
    pathMatch: 'full'
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./features/auth/signup/signup.component').then(
        (m) => m.SignupComponent
      )
  },
  // TODO: uncomment when login component is built
  // {
  //   path: 'login',
  //   loadComponent: () =>
  //     import('./features/auth/login/login.component').then(
  //       (m) => m.LoginComponent
  //     )
  // }
];