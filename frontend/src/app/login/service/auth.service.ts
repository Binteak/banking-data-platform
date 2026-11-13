import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, from, of, throwError } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';


export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  username: string;
  role: UserRole;
}

export type UserRole = 'DataAdmin' | 'Analyst';


// ============================================================
// AUTH SERVICE (JWT)
// - login(): POST /api/auth/login/ y guarda el access token.
// - El token se guarda en sessionStorage: se borra al cerrar la pestaña.
// - loginWithMicrosoft(): login con Microsoft Entra ID (popup + PKCE) y
//   guarda el access token que emite Microsoft para nuestra API.
// - isAuthenticated(): comprueba que existe y que no ha caducado (claim exp).
// La validación real (firma, audiencia, emisor y roles) la hace siempre el
// backend en cada petición: aquí el rol solo sirve para adaptar la interfaz.
// ============================================================

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private static readonly TOKEN_KEY = 'bdp_access_token';

  readonly loginUrl = environment.apiUrl + 'auth/login/';

  // El botón de Microsoft solo aparece si Entra ID está configurado
  readonly entraEnabled = !!(environment.entra?.clientId && environment.entra?.tenantId);

  private msalApp: Promise<any> | null = null;


  constructor(
    private http: HttpClient,
    private router: Router
  ) {}


  login(username: string, password: string): Observable<void> {

    // Demo sin backend (datos en el navegador): no hay API que proteger
    if (environment.useMockData) {
      if (username === 'admin' && password === '1234') {
        this.saveToken(this.buildMockToken(username));
        return of(undefined);
      }
      return throwError(() => ({ status: 401 }));
    }

    return this.http
      .post<LoginResponse>(this.loginUrl, { username, password })
      .pipe(
        tap(response => this.saveToken(response.access_token)),
        map(() => undefined)
      );
  }


  // ==========================================================
  // LOGIN CON MICROSOFT ENTRA ID
  // La librería de Microsoft (MSAL) se carga solo al pulsar el botón.
  // Cualquier cuenta de Microsoft puede entrar con rol Analyst (solo lectura);
  // DataAdmin solo para usuarios de nuestro tenant con ese rol asignado.
  // ==========================================================

  loginWithMicrosoft(): Observable<void> {
    if (!this.entraEnabled) {
      return throwError(() => ({ status: 0 }));
    }
    return from(this.microsoftPopupLogin());
  }

  // Precarga MSAL al abrir el login: así el popup se abre al instante tras el
  // clic y el navegador no lo bloquea.
  preloadMicrosoft(): void {
    if (this.entraEnabled) {
      this.getMsalApp().catch(() => (this.msalApp = null));
    }
  }

  private async microsoftPopupLogin(): Promise<void> {
    const msal = await this.getMsalApp();
    const result = await msal.loginPopup({
      scopes: [this.entraScope()],
      prompt: 'select_account'
    });
    this.saveToken(result.accessToken);
  }

  private getMsalApp(): Promise<any> {
    if (!this.msalApp) {
      this.msalApp = import('@azure/msal-browser').then(async ({ PublicClientApplication }) => {
        const app = new PublicClientApplication({
          auth: {
            clientId: environment.entra.clientId,
            // "common": cuentas de cualquier organización y cuentas personales
            authority: 'https://login.microsoftonline.com/common',
            redirectUri: `${window.location.origin}/auth-redirect`,
            postLogoutRedirectUri: `${window.location.origin}/auth-redirect`
          },
          cache: { cacheLocation: 'sessionStorage' }
        });
        await app.initialize();
        return app;
      });
    }
    return this.msalApp;
  }

  private entraScope(): string {
    return `api://${environment.entra.clientId}/access_as_user`;
  }


  logout(): void {
    try {
      sessionStorage.removeItem(AuthService.TOKEN_KEY);
    } catch {
      // Sin acceso a sessionStorage: no hay nada que borrar
    }
    // Borra también la caché local de MSAL (sin cerrar la sesión de Microsoft)
    this.msalApp?.then(app => app.clearCache()).catch(() => undefined);
    this.router.navigate(['/login']);
  }


  getToken(): string | null {
    try {
      return sessionStorage.getItem(AuthService.TOKEN_KEY);
    } catch {
      return null;
    }
  }


  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    const exp = this.readExpiration(token);
    if (!exp || exp * 1000 <= Date.now()) {
      this.clearToken();
      return false;
    }
    return true;
  }


  getUsername(): string | null {
    const payload = this.readPayload(this.getToken());
    return payload?.preferred_username ?? payload?.sub ?? null;
  }


  // Mismo criterio que el backend (api/auth.py). Solo adapta la interfaz:
  // si alguien lo manipula en el navegador, la API sigue devolviendo 403.
  getRole(): UserRole {
    const payload = this.readPayload(this.getToken());
    const roles: string[] = Array.isArray(payload?.roles) ? payload.roles : [];

    const isEntraToken = !!payload?.tid;
    const ownTenant = payload?.tid === environment.entra?.tenantId;

    if (roles.includes('DataAdmin') && (!isEntraToken || ownTenant)) {
      return 'DataAdmin';
    }
    return 'Analyst';
  }


  isDataAdmin(): boolean {
    return this.getRole() === 'DataAdmin';
  }


  // ==========================================================
  // PRIVADOS
  // ==========================================================

  private saveToken(token: string): void {
    try {
      sessionStorage.setItem(AuthService.TOKEN_KEY, token);
    } catch {
      // Navegación privada sin storage: la sesión dura lo que la página
    }
  }

  private clearToken(): void {
    try {
      sessionStorage.removeItem(AuthService.TOKEN_KEY);
    } catch {
      // nada
    }
  }

  private readExpiration(token: string): number | null {
    const exp = this.readPayload(token)?.exp;
    return typeof exp === 'number' ? exp : null;
  }

  // Lee el payload SIN verificar la firma (eso es trabajo del backend):
  // solo sirve para saber en el navegador si el token ha caducado.
  private readPayload(token: string | null): any | null {
    if (!token) {
      return null;
    }
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      return JSON.parse(atob(padded));
    } catch {
      return null;
    }
  }

  // Token de forma JWT para el modo demo sin backend (sin firma real).
  private buildMockToken(username: string): string {
    const encode = (obj: object) =>
      btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const exp = Math.floor(Date.now() / 1000) + 60 * 60;
    return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ sub: username, exp, roles: ['DataAdmin'] })}.mock`;
  }
}
