import { Component, HostListener } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

import { TranslatePipe } from '../../i18n/translate.pipe';
import { I18nService } from '../../i18n/i18n.service';
import { AuthService } from '../../login/service/auth.service';
interface PageInfo {
  section: string;
  title: string;
  description: string;
}

interface NavLink {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule, ButtonModule, DialogModule, TranslatePipe],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {

  // Información de la pantalla actual (se muestra en la barra oscura)
  page: PageInfo | null = null;

  pages: { [url: string]: PageInfo } = {
    '/dashboard':       { section: 'Overview',        title: 'Dashboard',       description: 'Risk data from ingestion to reporting, at a glance.' },
    '/data-explorer':   { section: 'Data Analysis',   title: 'Data Explorer',   description: 'Explore and review financial risk exposure data.' },
    '/upload-data':     { section: 'Data Ingestion',  title: 'Upload Data',     description: 'Upload financial risk exposure data into the platform.' },
    '/housekeeping':    { section: 'Data Governance', title: 'Housekeeping',    description: 'Search, review and remove risk exposure records.' },
    '/data-quality':    { section: 'Data Governance', title: 'Data Quality',    description: 'Validate the integrity and consistency of the dataset before reporting.' },
    '/audit-reporting': { section: 'Risk Reporting',  title: 'Audit Reporting', description: 'Calculate risk metrics and generate regulatory reports.' },
    '/documentation':   { section: 'Help',            title: 'Documentation',   description: 'Functional and technical documentation of the platform.' }
  };

  showMenu = false;

  // Globo con la descripción de la pantalla (botón "i" de la franja)
  showInfo = false;

  visible: boolean = false;

  navLinks: NavLink[] = [
    { label: 'Dashboard',       path: '/dashboard',       icon: 'pi pi-home' },
    { label: 'Data Explorer',   path: '/data-explorer',   icon: 'pi pi-search' },
    { label: 'Upload Data',     path: '/upload-data',     icon: 'pi pi-upload' },
    { label: 'Housekeeping',    path: '/housekeeping',    icon: 'pi pi-database' },
    { label: 'Data Quality',    path: '/data-quality',    icon: 'pi pi-check-circle' },
    { label: 'Audit Reporting', path: '/audit-reporting', icon: 'pi pi-chart-bar' }
  ];

  constructor(private router: Router, public i18n: I18nService, private auth: AuthService) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.actualizarTitulo(event.urlAfterRedirects);
        this.showMenu = false;
        this.showInfo = false;
      }
    });
  }

  actualizarTitulo(url: string) {
    const key = Object.keys(this.pages).find(path => url.startsWith(path));
    this.page = key ? this.pages[key] : null;
  }

  onMenuToggle(): void {
    this.showMenu = !this.showMenu;
  }

  closeMenu(): void {
    this.showMenu = false;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenu();
    this.showInfo = false;
  }

  toggleInfo(event: Event): void {
    event.stopPropagation();
    this.showInfo = !this.showInfo;
  }

  // Cierra el globo de información al pulsar fuera de él
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.showInfo) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.page-info')) {
      this.showInfo = false;
    }
  }

  logout() {
    this.showMenu = false;
    this.auth.logout();
  }
}
