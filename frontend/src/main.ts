import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app/app.routes';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { importProvidersFrom } from '@angular/core';

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './app/auth/auth.interceptor';



// ============================================================
// PUENTE DEL LOGIN CON MICROSOFT (MSAL v5)
// El popup de Microsoft vuelve a /auth-redirect con el código de
// autorización. Esta página solo reenvía la respuesta a la ventana principal
// y se cierra: no arranca la aplicación Angular.
// ============================================================
const isMsalRedirect = window.location.pathname === '/auth-redirect';

if (isMsalRedirect) {
  import('@azure/msal-browser/redirect-bridge')
    .then(({ broadcastResponseToMainFrame }) => broadcastResponseToMainFrame())
    .catch(() => window.close());
} else {
  bootstrapApp();
}

function bootstrapApp() {
  bootstrapApplication(AppComponent, {
    providers: [ 
      provideRouter(appRoutes), 
      importProvidersFrom(BrowserAnimationsModule),
      provideHttpClient(withInterceptors([authInterceptor]))
    ]
  });
}
