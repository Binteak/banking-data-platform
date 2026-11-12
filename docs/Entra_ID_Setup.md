# Login con Microsoft Entra ID

La app admite dos accesos: el usuario demo (`admin` / `1234`) y **Iniciar sesión con Microsoft**.
El segundo es opcional: si no se configura, el botón no aparece.

## 1. Registrar la app (entra.microsoft.com)

1. **Applications → App registrations → New registration**
   - Name: `Banking Data Platform`
   - Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**
   - Redirect URI: plataforma **Single-page application (SPA)** → `http://localhost:4201/auth-redirect`
2. **Authentication** → añadir otra URI SPA: `https://banking-data-platform.onrender.com/auth-redirect`
3. **Expose an API** → *Add* en *Application ID URI* (deja `api://<client-id>`) → *Add a scope*:
   - Scope name: `access_as_user` · Who can consent: **Admins and users**
4. **Manifest** → `requestedAccessTokenVersion` (o `accessTokenAcceptedVersion`) = `2` → Save
5. **App roles** → *Create app role* (Allowed member types: Users/Groups):
   - `DataAdmin` — puede subir y borrar datos
   - `Analyst` — solo consulta
6. **Enterprise applications → Banking Data Platform → Users and groups → Add user** → asígnate `DataAdmin`
7. Copia de *Overview* el **Application (client) ID** y el **Directory (tenant) ID**.
   No son secretos: la app usa PKCE y no tiene *client secret*.

## 2. Configurar los IDs

**Frontend** (`src/environments/environment.ts` y `environment.prod.ts`):

```ts
entra: {
  clientId: '<client-id>',
  tenantId: '<tenant-id>'
}
```

**Backend** (variables de entorno en Render o `docker-compose.yml`):

```
ENTRA_CLIENT_ID=<client-id>
ENTRA_TENANT_ID=<tenant-id>
```

## 3. Cómo funciona

- Angular abre un popup de Microsoft (MSAL, Authorization Code + PKCE). Microsoft vuelve a
  `/auth-redirect`, que reenvía la respuesta a la ventana principal y se cierra.
- El access token de Microsoft se envía a la API igual que el token demo (`Authorization: Bearer`).
- Django verifica la firma RS256 con las claves públicas de Microsoft (JWKS, en caché), la
  audiencia (`<client-id>`), el emisor (`https://login.microsoftonline.com/<tid>/v2.0`) y la caducidad.
- Rol: `DataAdmin` solo si el token viene del tenant propio **y** trae ese rol; en cualquier
  otro caso `Analyst`. En una app multi-tenant, otro tenant podría asignar nuestros roles a sus
  usuarios: por eso se ignoran.
- Para restringir el acceso a tenants concretos: `ENTRA_ALLOWED_TENANTS=<tid1>,<tid2>`.

## 4. Coste y mantenimiento

- Microsoft Entra ID Free: inicio de sesión ilimitado sin coste. No se usa External ID (de pago por usuario activo).
- Para que el tenant no se considere abandonado: suscripción de Azure activa **sin recursos** (0 €)
  con una alerta de presupuesto, y uso periódico del login.
- Si Entra ID dejara de estar disponible, el acceso demo sigue funcionando.
