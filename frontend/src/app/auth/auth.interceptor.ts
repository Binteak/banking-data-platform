import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../environments/environment';
import { AuthService } from '../login/service/auth.service';


// ============================================================
// AUTH INTERCEPTOR
// Añade "Authorization: Bearer <token>" SOLO a las peticiones a nuestra API
// (nunca a otros dominios ni a assets). Si la API responde 401 (token
// caducado o inválido) cierra la sesión y vuelve al login.
// ============================================================

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const auth = inject(AuthService);

  const isApiRequest = req.url.startsWith(environment.apiUrl);
  const isLoginRequest = req.url.startsWith(auth.loginUrl);
  const token = auth.getToken();

  const request = isApiRequest && !isLoginRequest && token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && isApiRequest && !isLoginRequest) {
        auth.logout();
      }
      return throwError(() => error);
    })
  );
};
