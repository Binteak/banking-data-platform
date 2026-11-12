import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { InputTextModule } from 'primeng/inputtext';


import { TranslatePipe } from '../../i18n/translate.pipe';
import { I18nService } from '../../i18n/i18n.service';
import { AuthService } from '../service/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, ButtonModule, PasswordModule, InputTextModule, TranslatePipe],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  errorMessage = '';
  loading = false;
  loadingMicrosoft = false;

  constructor(
    private router: Router,
    public auth: AuthService,
    public i18n: I18nService
  ) {}

  ngOnInit(): void {
    this.auth.preloadMicrosoft();
  }

  // Login con Microsoft Entra ID (popup). Si el usuario cierra el popup no se
  // muestra ningún error.
  onMicrosoftLogin() {
    if (this.loadingMicrosoft || this.loading) {
      return;
    }
    this.loadingMicrosoft = true;
    this.errorMessage = '';

    this.auth.loginWithMicrosoft().subscribe({
      next: () => {
        this.loadingMicrosoft = false;
        this.router.navigate(['/dashboard']);
      },
      error: (error: any) => {
        this.loadingMicrosoft = false;
        const cancelled = ['user_cancelled', 'popup_window_error', 'empty_window_error']
          .includes(error?.errorCode);
        if (!cancelled) {
          this.errorMessage = 'Microsoft sign-in failed. Try again or use the demo access.';
        }
      }
    });
  }

  // Login contra el backend: devuelve un JWT que el interceptor añade a cada
  // petición. No se registran credenciales en consola.
  onLogin() {
    if (this.loading) {
      return;
    }
    if (!this.username.trim() || !this.password) {
      this.errorMessage = 'Enter your username and password';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.auth.login(this.username.trim(), this.password).subscribe({
      next: () => {
        this.loading = false;
        this.password = '';
        this.router.navigate(['/dashboard']);
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.password = '';
        this.errorMessage = this.messageFor(error?.status);
      }
    });
  }

  private messageFor(status: number | undefined): string {
    switch (status) {
      case 400:
      case 401:
        return 'Invalid username or password';
      case 429:
        return 'Too many attempts. Wait a minute and try again.';
      default:
        return 'The server is not available. Try again in a few seconds.';
    }
  }
}

