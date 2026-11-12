// Producción (Render): los datos vienen del backend (almacén JSON).
// La web y la API comparten dominio: en Render, una regla de reescritura
// envía /api/* al servicio del backend (sin CORS ni URLs fijas en el código).
// Para volver a la demo sin backend (datos en el navegador): useMockData: true.
export const environment = {
  production: true,
  useMockData: false,
  apiUrl: '/api/',
  // Microsoft Entra ID (opcional). Vacío = solo login demo, sin botón de Microsoft.
  // Guía: docs/Entra_ID_Setup.md
  // No son secretos: la app es pública y usa PKCE (sin client secret).
  entra: {
    clientId: '865e23e7-814b-43d6-8c63-4382f04a8eec',
    tenantId: '5429381b-9b96-4d68-a37e-e090b4b241c1'
  }
};
