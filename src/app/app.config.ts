import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { mockInterceptor } from './core/interceptors/mock.interceptor';

const httpClientProviders =
  environment.useMock === true
    ? provideHttpClient(withInterceptors([mockInterceptor]))
    : provideHttpClient();

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    httpClientProviders,
  ],
};
