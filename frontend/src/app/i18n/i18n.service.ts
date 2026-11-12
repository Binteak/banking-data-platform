import { Injectable } from '@angular/core';

import { ES } from './es';


export type Lang = 'en' | 'es';


// ============================================================
// I18N SERVICE
// Idioma actual de la aplicación. El texto en inglés es la "clave":
// si el idioma es español se busca su traducción en el diccionario ES.
// ============================================================

@Injectable({
  providedIn: 'root'
})
export class I18nService {

  lang: Lang = 'en';


  constructor() {

    // Recuerda el idioma elegido entre visitas
    try {
      const saved = localStorage.getItem('lang');
      if (saved === 'en' || saved === 'es') {
        this.lang = saved;
      }
    } catch {
      // Sin acceso a localStorage: se queda en inglés
    }

    document.documentElement.lang = this.lang;

  }


  setLang(lang: Lang): void {

    this.lang = lang;

    document.documentElement.lang = lang;

    try {
      localStorage.setItem('lang', lang);
    } catch {
      // No pasa nada si no se puede guardar
    }

  }


  // Traduce un texto en inglés al idioma actual
  t(text: string): string {

    if (!text || this.lang === 'en') {
      return text;
    }

    return ES[text] ?? text;

  }

}
