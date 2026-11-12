import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { AuthService } from './auth.service';

// Construye un JWT (sin firma real) con el exp indicado, en segundos
function fakeToken(exp: number, extra: object = {}): string {
  const enc = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '');
  return `${enc({ alg: 'HS256', typ: 'JWT' })}.${enc({ sub: 'admin', exp, ...extra })}.firma`;
}

const inOneHour = () => Math.floor(Date.now() / 1000) + 3600;

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    sessionStorage.clear();
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy }
      ]
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    sessionStorage.clear();
  });

  it('should store the token returned by the login endpoint', () => {
    const token = fakeToken(Math.floor(Date.now() / 1000) + 3600);

    service.login('admin', '1234').subscribe();
    const req = http.expectOne(service.loginUrl);
    expect(req.request.method).toBe('POST');
    req.flush({ access_token: token, token_type: 'Bearer', expires_in: 3600, username: 'admin' });

    expect(service.getToken()).toBe(token);
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.getUsername()).toBe('admin');
  });

  it('should treat an expired token as not authenticated', () => {
    sessionStorage.setItem('bdp_access_token', fakeToken(Math.floor(Date.now() / 1000) - 10));
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.getToken()).toBeNull();
  });

  it('should clear the token and go to login on logout', () => {
    sessionStorage.setItem('bdp_access_token', fakeToken(Math.floor(Date.now() / 1000) + 3600));
    service.logout();
    expect(service.getToken()).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should read the DataAdmin role from a demo token', () => {
    sessionStorage.setItem('bdp_access_token', fakeToken(inOneHour(), { roles: ['DataAdmin'] }));
    expect(service.isDataAdmin()).toBeTrue();
  });

  it('should treat an external Microsoft tenant as Analyst even with DataAdmin claim', () => {
    sessionStorage.setItem('bdp_access_token',
      fakeToken(inOneHour(), { roles: ['DataAdmin'], tid: 'otro-tenant' }));
    expect(service.getRole()).toBe('Analyst');
  });

  it('should default to Analyst without roles', () => {
    sessionStorage.setItem('bdp_access_token', fakeToken(inOneHour()));
    expect(service.getRole()).toBe('Analyst');
  });
});
