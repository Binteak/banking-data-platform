// export const environment = {
//     production: false,
//     apiUrl: 'http://127.0.0.1:8001/api' //backend local de Django
//   };   

export const environment = {
  production: false,
  useMockData: false,
  apiUrl: 'http://127.0.0.1:8001/api/',
  // Microsoft Entra ID (opcional). Vacío = solo login demo, sin botón de Microsoft.
  // Guía: docs/Entra_ID_Setup.md
  // No son secretos: la app es pública y usa PKCE (sin client secret).
  entra: {
    clientId: '865e23e7-814b-43d6-8c63-4382f04a8eec',
    tenantId: '5429381b-9b96-4d68-a37e-e090b4b241c1'
  }
};
