import { Pipe, PipeTransform } from '@angular/core';

import { I18nService } from './i18n.service';


// Uso en las plantillas:  {{ 'Data Explorer' | t }}
// Es "impuro" para que se actualice al cambiar de idioma sin recargar.
@Pipe({
  name: 't',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform {

  constructor(private i18n: I18nService) {}

  transform(text: string): string {

    return this.i18n.t(text);

  }

}
