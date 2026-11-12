// import { ApplicationConfig } from '@angular/core';
// import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
// import { provideAnimations } from '@angular/platform-browser/animations';
// // import { providePrimeNG } from 'primeng/config';
// import Aura from '@primeng/themes/aura';

// export const appConfig: ApplicationConfig = {
//     providers: [
//         provideAnimations(),
//         provideAnimationsAsync(),
//         // providePrimeNG({
//         //     theme: {
//         //         preset: Aura
//         //     }
//         // })
//     ]
// };


import { ApplicationConfig } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './src/app/app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled'
      })
    )
  ]
};


