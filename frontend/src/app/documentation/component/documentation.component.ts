import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { I18nService } from '../../i18n/i18n.service';
import { DOC_SECTIONS, DocSection, Txt } from '../content/documentation.content';


interface NavGroup {
  label: Txt;
  sections: DocSection[];
}


// ============================================================
// DOCUMENTACIÓN
// - Menú lateral agrupado + buscador.
// - Ficha por pantalla: objetivo, uso, reglas/fórmulas, variables,
//   persistencia, API y notas.
// - Descarga en PDF de la sección actual o de toda la documentación,
//   en el idioma activo.
// El contenido vive en ../content/documentation.content.ts
// ============================================================

@Component({
  standalone: true,
  selector: 'app-documentation',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './documentation.component.html',
  styleUrls: ['./documentation.component.css'],
})
export class DocumentationComponent implements OnInit {

  readonly sections = DOC_SECTIONS;

  selected: DocSection = DOC_SECTIONS[0];
  search = '';
  exporting: 'section' | 'all' | null = null;

  // Textos de la propia pantalla (el contenido ya es bilingüe)
  readonly L = {
    docs: { en: 'Documentation', es: 'Documentación' },
    search: { en: 'Search in the documentation', es: 'Buscar en la documentación' },
    noResults: { en: 'No sections match your search.', es: 'Ninguna sección coincide con la búsqueda.' },
    downloadAll: { en: 'Download all (PDF)', es: 'Descargar todo (PDF)' },
    downloadSection: { en: 'Download PDF', es: 'Descargar PDF' },
    openScreen: { en: 'Open screen', es: 'Abrir pantalla' },
    purpose: { en: 'Purpose', es: 'Objetivo' },
    howTo: { en: 'How to use it', es: 'Cómo se usa' },
    formula: { en: 'Rule / formula', es: 'Regla / fórmula' },
    name: { en: 'Name', es: 'Nombre' },
    description: { en: 'Description', es: 'Descripción' },
    column: { en: 'Column', es: 'Columna' },
    type: { en: 'Type', es: 'Tipo' },
    required: { en: 'Required', es: 'Obligatorio' },
    yes: { en: 'Yes', es: 'Sí' },
    no: { en: 'No', es: 'No' },
    persistence: { en: 'Data stored', es: 'Datos que se guardan' },
    api: { en: 'API endpoints', es: 'Endpoints de la API' },
    method: { en: 'Method', es: 'Método' },
    endpoint: { en: 'Endpoint', es: 'Endpoint' },
    access: { en: 'Access', es: 'Acceso' },
    previous: { en: 'Previous', es: 'Anterior' },
    next: { en: 'Next', es: 'Siguiente' },
    generated: { en: 'Generated on', es: 'Generado el' },
    page: { en: 'Page', es: 'Página' },
    tocTitle: { en: 'Contents', es: 'Contenido' },
    fictional: {
      en: 'Demo with simulated data. Nexum Bank is a fictional brand.',
      es: 'Demo con datos simulados. Nexum Bank es una marca ficticia.'
    },
  };

  readonly ROLE_LABEL: { [role: string]: Txt } = {
    'Public': { en: 'Public', es: 'Público' },
    'Any authenticated user': { en: 'Any authenticated user', es: 'Cualquier usuario autenticado' },
    'DataAdmin': { en: 'DataAdmin', es: 'DataAdmin' },
  };


  constructor(
    public i18n: I18nService,
    private route: ActivatedRoute,
    private router: Router
  ) {}


  ngOnInit(): void {
    // Permite enlazar directamente una sección: /documentation?section=data-quality
    this.route.queryParamMap.subscribe(params => {
      const found = this.sections.find(s => s.id === params.get('section'));
      if (found) {
        this.selected = found;
      }
    });
  }


  // ==========================================================
  // IDIOMA
  // ==========================================================

  tx(text: Txt | undefined): string {
    if (!text) {
      return '';
    }
    return this.i18n.lang === 'es' ? text.es : text.en;
  }


  // ==========================================================
  // NAVEGACIÓN Y BÚSQUEDA
  // ==========================================================

  get groups(): NavGroup[] {
    const visible = this.filteredSections;
    const groups: NavGroup[] = [];
    for (const section of visible) {
      let group = groups.find(g => g.label.en === section.group.en);
      if (!group) {
        group = { label: section.group, sections: [] };
        groups.push(group);
      }
      group.sections.push(section);
    }
    return groups;
  }

  get filteredSections(): DocSection[] {
    const query = this.normalize(this.search);
    if (!query) {
      return this.sections;
    }
    return this.sections.filter(section => this.normalize(this.searchableText(section)).includes(query));
  }

  select(section: DocSection): void {
    this.selected = section;
    this.router.navigate([], { queryParams: { section: section.id }, replaceUrl: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get index(): number {
    return this.sections.indexOf(this.selected);
  }

  get previous(): DocSection | null {
    return this.index > 0 ? this.sections[this.index - 1] : null;
  }

  get next(): DocSection | null {
    return this.index < this.sections.length - 1 ? this.sections[this.index + 1] : null;
  }

  private searchableText(section: DocSection): string {
    const parts: string[] = [
      this.tx(section.title), this.tx(section.summary), this.tx(section.purpose),
      ...(section.steps ?? []).map(s => this.tx(s)),
      ...(section.rules?.rows ?? []).flatMap(r => [this.tx(r.name), r.formula, this.tx(r.description)]),
      ...(section.fields?.rows ?? []).flatMap(f => [f.name, f.type, this.tx(f.description)]),
      ...(section.endpoints ?? []).flatMap(e => [e.path, this.tx(e.description)]),
      ...(section.blocks ?? []).flatMap(b => [this.tx(b.title), ...b.items.map(i => this.tx(i))]),
    ];
    return parts.join(' ');
  }

  private normalize(text: string): string {
    return (text || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  }


  // ==========================================================
  // PDF
  // ==========================================================

  downloadSection(): void {
    this.exporting = 'section';
    try {
      this.buildPdf([this.selected], `${this.selected.id}`);
    } finally {
      this.exporting = null;
    }
  }

  downloadAll(): void {
    this.exporting = 'all';
    try {
      this.buildPdf(this.sections, 'complete');
    } finally {
      this.exporting = null;
    }
  }

  private buildPdf(sections: DocSection[], suffix: string): void {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;
    const red: [number, number, number] = [229, 57, 53];
    const dark: [number, number, number] = [28, 31, 38];
    const grey: [number, number, number] = [107, 114, 128];
    const now = new Date();
    const dateText = now.toLocaleDateString(this.i18n.lang === 'es' ? 'es-ES' : 'en-GB');

    let y = 0;

    const ensureSpace = (needed: number) => {
      if (y + needed > pageHeight - 18) {
        pdf.addPage();
        y = 20;
      }
    };

    const heading = (text: string) => {
      ensureSpace(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11.5);
      pdf.setTextColor(...dark);
      pdf.text(this.pdfSafe(text), margin, y);
      pdf.setDrawColor(...red);
      pdf.setLineWidth(0.6);
      pdf.line(margin, y + 1.8, margin + 12, y + 1.8);
      y += 7;
    };

    const paragraph = (text: string, size = 10, color = dark, style: 'normal' | 'italic' = 'normal') => {
      pdf.setFont('helvetica', style);
      pdf.setFontSize(size);
      pdf.setTextColor(...color);
      const lines = pdf.splitTextToSize(this.pdfSafe(text), contentWidth);
      for (const line of lines) {
        ensureSpace(5.5);
        pdf.text(line, margin, y);
        y += size * 0.5;
      }
      y += 2;
    };

    const list = (items: string[], numbered: boolean) => {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(...dark);
      items.forEach((item, i) => {
        const bullet = numbered ? `${i + 1}.` : '•';
        const lines = pdf.splitTextToSize(this.pdfSafe(item), contentWidth - 7);
        lines.forEach((line: string, j: number) => {
          ensureSpace(5.5);
          if (j === 0) {
            pdf.text(bullet, margin + 1, y);
          }
          pdf.text(line, margin + 7, y);
          y += 5;
        });
      });
      y += 2;
    };

    const table = (head: string[], body: string[][], columnStyles: any = {}) => {
      autoTable(pdf, {
        startY: y,
        head: [head.map(h => this.pdfSafe(h))],
        body: body.map(row => row.map(cell => this.pdfSafe(cell))),
        margin: { left: margin, right: margin },
        styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 2.2, textColor: dark, lineColor: [229, 231, 235], lineWidth: 0.2 },
        headStyles: { fillColor: dark, textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles,
      });
      y = (pdf as any).lastAutoTable.finalY + 7;
    };

    // ---------------- PORTADA / CABECERA ----------------
    pdf.setFillColor(...red);
    pdf.rect(0, 0, pageWidth, 34, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text('Nexum Bank', margin, 15);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.text(`Banking Data Platform · ${this.tx(this.L.docs)}`, margin, 23);
    pdf.setFontSize(8.5);
    pdf.text(`${this.tx(this.L.generated)} ${dateText}`, pageWidth - margin, 23, { align: 'right' });
    y = 46;

    // Índice si hay varias secciones
    if (sections.length > 1) {
      heading(this.tx(this.L.tocTitle));
      list(sections.map(s => `${this.tx(s.title)} — ${this.tx(s.summary)}`), true);
    }

    // ---------------- SECCIONES ----------------
    sections.forEach(section => {
      // Con índice, cada sección empieza en una página nueva
      if (sections.length > 1) {
        pdf.addPage();
        y = 20;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(...red);
      pdf.text(this.pdfSafe(this.tx(section.group).toUpperCase()), margin, y);
      y += 7;
      pdf.setFontSize(17);
      pdf.setTextColor(...dark);
      pdf.text(this.pdfSafe(this.tx(section.title)), margin, y);
      y += 7;
      paragraph(this.tx(section.summary), 10.5, grey, 'italic');

      heading(this.tx(this.L.purpose));
      paragraph(this.tx(section.purpose));

      if (section.steps?.length) {
        heading(this.tx(this.L.howTo));
        list(section.steps.map(s => this.tx(s)), true);
      }

      if (section.rules?.rows.length) {
        heading(this.tx(section.rules.title));
        table(
          [this.tx(this.L.name), this.tx(this.L.formula), this.tx(this.L.description)],
          section.rules.rows.map(r => [this.tx(r.name), r.formula, this.tx(r.description)]),
          { 0: { cellWidth: 38, fontStyle: 'bold' }, 1: { cellWidth: 58, font: 'courier' } }
        );
      }

      if (section.fields?.rows.length) {
        heading(this.tx(section.fields.title));
        table(
          [this.tx(this.L.column), this.tx(this.L.type), this.tx(this.L.required), this.tx(this.L.description)],
          section.fields.rows.map(f => [f.name, f.type, this.tx(f.required ? this.L.yes : this.L.no), this.tx(f.description)]),
          { 0: { cellWidth: 32, font: 'courier' }, 1: { cellWidth: 34 }, 2: { cellWidth: 20 } }
        );
      }

      if (section.persistence?.length) {
        heading(this.tx(this.L.persistence));
        list(section.persistence.map(p => this.tx(p)), false);
      }

      if (section.endpoints?.length) {
        heading(this.tx(this.L.api));
        table(
          [this.tx(this.L.method), this.tx(this.L.endpoint), this.tx(this.L.access), this.tx(this.L.description)],
          section.endpoints.map(e => [e.method, e.path, this.tx(this.ROLE_LABEL[e.role]), this.tx(e.description)]),
          { 0: { cellWidth: 18, fontStyle: 'bold' }, 1: { cellWidth: 52, font: 'courier' }, 2: { cellWidth: 30 } }
        );
      }

      for (const block of section.blocks ?? []) {
        heading(this.tx(block.title));
        list(block.items.map(item => this.tx(item)), false);
      }
    });

    // ---------------- PIE DE PÁGINA ----------------
    const pages = pdf.getNumberOfPages();
    for (let p = 1; p <= pages; p++) {
      pdf.setPage(p);
      pdf.setDrawColor(229, 231, 235);
      pdf.setLineWidth(0.2);
      pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(...grey);
      pdf.text(this.pdfSafe(this.tx(this.L.fictional)), margin, pageHeight - 7);
      pdf.text(`${this.tx(this.L.page)} ${p} / ${pages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
    }

    const stamp = now.toISOString().slice(0, 10).replace(/-/g, '');
    pdf.save(`NexumBank_BDP_Documentation_${suffix}_${this.i18n.lang}_${stamp}.pdf`);
  }

  // Las fuentes estándar de PDF no tienen símbolos matemáticos:
  // se sustituyen por equivalentes legibles.
  private pdfSafe(text: string): string {
    const map: { [symbol: string]: string } = {
      'Σ': 'SUM ', '∈': 'in', '⇒': '=>', '⇔': '<=>', '→': '->', '∧': 'AND', '∨': 'OR',
      '≠': '!=', '≤': '<=', '≥': '>=', '⊇': 'includes', '∀': 'for all',
    };
    return (text || '').replace(/[Σ∈⇒⇔→∧∨≠≤≥⊇∀]/g, symbol => map[symbol]).replace(/SUM  /g, 'SUM ');
  }
}
