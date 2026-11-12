import { Component } from '@angular/core';
import { DashboardService } from '../service/dashboard.service';

import { CardModule } from 'primeng/card';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { RippleModule } from 'primeng/ripple';
import { InputTextModule } from 'primeng/inputtext';
import { AvatarModule } from 'primeng/avatar';

import { TranslatePipe } from '../../i18n/translate.pipe';
import { I18nService } from '../../i18n/i18n.service';
import { DataExplorerService } from '../../data-explorer/service/data-explorer.service';
// Indicadores de la última fecha de reporte disponible
interface DashboardKpis {
  reportingDate: string;
  exposures: number;
  countries: number;
  totalEad: number;
  defaults: number;
  defaultRate: number;
}


interface DashboardModule {
  section: string;
  title: string;
  description: string;
  icon: string;
  route: string;
}


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
   
    CardModule,
    RouterModule,
    CommonModule,
    ButtonModule,
    AvatarModule,
    InputTextModule,
    DialogModule,
    RippleModule,
    TranslatePipe
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {

  constructor(
    private dashboardService: DashboardService,
    private dataService: DataExplorerService,
    public i18n: I18nService,
    private router: Router
  ) {}

  menuItems = [
    'All',
    'Data Ingestion',
    'Data Governance',
    'Data Analysis',
    'Risk Reporting'
  ];

  selected = 'All';


  // Módulos de la plataforma. Misma sección e icono que en la
  // franja superior y en el menú, para que todo sea coherente.
  modules: DashboardModule[] = [
    {
      section: 'Data Ingestion',
      title: 'Upload Data',
      description: 'Upload financial risk exposure datasets into the platform.',
      icon: 'pi pi-upload',
      route: '/upload-data'
    },
    {
      section: 'Data Governance',
      title: 'Housekeeping',
      description: 'Search, review and remove risk exposure records when required.',
      icon: 'pi pi-database',
      route: '/housekeeping'
    },
    {
      section: 'Data Governance',
      title: 'Data Quality',
      description: 'Validate the integrity, completeness and consistency of risk data.',
      icon: 'pi pi-check-circle',
      route: '/data-quality'
    },
    {
      section: 'Data Analysis',
      title: 'Data Explorer',
      description: 'Explore and review financial risk data using interactive filters.',
      icon: 'pi pi-search',
      route: '/data-explorer'
    },
    {
      section: 'Risk Reporting',
      title: 'Audit Reporting',
      description: 'Calculate risk metrics and generate regulatory reports.',
      icon: 'pi pi-chart-bar',
      route: '/audit-reporting'
    }
  ];


  get visibleModules(): DashboardModule[] {

    return this.selected === 'All'
      ? this.modules
      : this.modules.filter(module => module.section === this.selected);

  }

  exerciseGroups: any[] = [];

  // null hasta que llegan los datos (o si no hay datos): la fila no se muestra
  kpis: DashboardKpis | null = null;


  ngOnInit(): void {

    this.loadKpis();

  }


  // ==========================================================
  // KPIs — calculados sobre la última fecha de reporte
  // (mismo servicio que Data Explorer: mock o API real)
  // ==========================================================

  loadKpis(): void {

    this.dataService.getDataTable().subscribe({

      next: (res: any) => {

        const rows: any[] = res?.data ?? [];

        if (!rows.length) {
          return;
        }

        const latest = rows
          .map(row => row.reportingDate)
          .filter(Boolean)
          .sort()
          .pop();

        const current = rows.filter(row => row.reportingDate === latest);

        const defaults = current.filter(row => row.defaultFlag).length;

        this.kpis = {
          reportingDate: latest,
          exposures: current.length,
          countries: new Set(current.map(row => row.country)).size,
          totalEad: current.reduce((sum, row) => sum + (Number(row.eadAmount) || 0), 0),
          defaults,
          defaultRate: current.length ? defaults / current.length : 0
        };

      },

      // Sin datos el dashboard sigue funcionando: solo se oculta la fila
      error: () => this.kpis = null

    });

  }


  // 12400000 -> "€12.4M" (en) / "12,4 M€" (es)
  formatCompactEur(value: number): string {

    return new Intl.NumberFormat(
      this.i18n.lang === 'es' ? 'es-ES' : 'en-US',
      {
        style: 'currency',
        currency: 'EUR',
        notation: 'compact',
        maximumFractionDigits: 1
      }
    ).format(value);

  }

  onSelect(item: string): void {
    this.selected = item;
  }

  openModule(route: string): void {

    this.router.navigate([route]).then(() => {

      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });

    });

  }

}