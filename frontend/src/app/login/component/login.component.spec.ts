import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService } from '../service/auth.service';

describe('LoginComponent', () => {

  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let routerSpy: jasmine.SpyObj<Router>;
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    authSpy = jasmine.createSpyObj('AuthService', ['login', 'loginWithMicrosoft', 'preloadMicrosoft'], { entraEnabled: true });

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('should navigate to dashboard when the API returns a token', () => {
    authSpy.login.and.returnValue(of(undefined));
    component.username = 'admin';
    component.password = '1234';

    component.onLogin();

    expect(authSpy.login).toHaveBeenCalledWith('admin', '1234');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(component.password).toBe('');
  });


  it('SHOULD show an error message WHEN the API returns 401', () => {
    authSpy.login.and.returnValue(throwError(() => ({ status: 401 })));
    component.username = 'admin';
    component.password = 'incorrecto';

    component.onLogin();

    expect(routerSpy.navigate).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe('Invalid username or password');
  });


  it('SHOULD warn about rate limiting WHEN the API returns 429', () => {
    authSpy.login.and.returnValue(throwError(() => ({ status: 429 })));
    component.username = 'admin';
    component.password = 'x';

    component.onLogin();

    expect(component.errorMessage).toBe('Too many attempts. Wait a minute and try again.');
  });


  it('SHOULD not call the API WITH empty fields', () => {
    component.username = '';
    component.password = '';

    component.onLogin();

    expect(authSpy.login).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe('Enter your username and password');
  });


  it('should go to dashboard after signing in with Microsoft', () => {
    authSpy.loginWithMicrosoft.and.returnValue(of(undefined));

    component.onMicrosoftLogin();

    expect(authSpy.loginWithMicrosoft).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });


  it('SHOULD not show an error WHEN the user closes the Microsoft popup', () => {
    authSpy.loginWithMicrosoft.and.returnValue(throwError(() => ({ errorCode: 'user_cancelled' })));

    component.onMicrosoftLogin();

    expect(component.errorMessage).toBe('');
  });

});
