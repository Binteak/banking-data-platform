import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { DividerModule } from 'primeng/divider';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';

import {
  ConfirmationService,
  MessageService
} from 'primeng/api';

import { HousekeepingService } from '../service/housekeeping.service';


import { TranslatePipe } from '../../i18n/translate.pipe';
import { I18nService } from '../../i18n/i18n.service';
import { AuthService } from '../../login/service/auth.service';
@Component({
  standalone: true,

  selector: 'app-housekeeping',

  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    DropdownModule,
    DividerModule,
    ConfirmDialogModule,
    ToastModule,
    TranslatePipe
  ],

  providers: [
    ConfirmationService,
    MessageService
  ],

  templateUrl: './housekeeping.component.html',

  styleUrls: [
    './housekeeping.component.css'
  ]
})


export class HousekeepingComponent
  implements OnInit {


  records: any[] = [];

  selectedRecords: any[] = [];

  // En móvil se muestran tarjetas de 10 en 10
  mobileLimit: number = 10;

  loading = false;

  //Filtros dinámicos
  reportingDates: any[] = [];

  countries: any[] = [];

  portfolios: any[] = [];

  productTypes: any[] = [];

  riskStages: any[] = [];

  ratings: any[] = [];

  dataSources: any[] = [];


  // En móvil los filtros secundarios van plegados
  showAllFilters: boolean = false;


  filters = {

    reporting_date: '',

    entity_id: '',

    entity_name: '',

    country: '',

    portfolio: '',

    product_type: '',

    risk_stage: '',

    rating: '',

    default_flag: '',

    data_source: ''

  };


  defaultOptions = [
    {
      label: 'Default',
      value: 'true'
    },

    {
      label: 'Not Default',
      value: 'false'
    }

  ];



  // Rol Analyst: solo lectura (el backend devuelve 403 igualmente)
  get canWrite(): boolean {
    return this.auth.isDataAdmin();
  }

  constructor(

    private auth: AuthService,

    private i18n: I18nService,

    private api: HousekeepingService,

    private confirmationService:
      ConfirmationService,

    private messageService:
      MessageService

  ) {}


  // ============================================================
  // INIT
  // ============================================================

  ngOnInit(): void {

    this.search();

  }


  // Filtros secundarios aplicados (se muestra en el botón "Más filtros")
  get secondaryFilterCount(): number {

    const primary = ['reporting_date', 'entity_name'];

    return Object.entries(this.filters)
      .filter(([key, value]) => !primary.includes(key) && !!value)
      .length;

  }


  // ============================================================
  // SEARCH
  // ============================================================

  search(): void {

    this.loading = true;

    this.selectedRecords = [];

    this.mobileLimit = 10;

    this.api.search(
      this.filters
    ).subscribe({

      next: (response: any) => {

        this.records =
          response?.data ?? [];


        // --------------------------------------------------------
        // DYNAMIC FILTERS
        // --------------------------------------------------------

        this.buildReportingDates(
          response?.filters?.reporting_dates
        );

        this.buildCountries(
          response?.filters?.countries
        );

        this.buildPortfolios(
          response?.filters?.portfolios
        );

        this.buildProductTypes(
          response?.filters?.product_types
        );

        this.buildRiskStages(
          response?.filters?.risk_stages
        );

        this.buildRatings(
          response?.filters?.ratings
        );

        this.buildDataSources(
          response?.filters?.data_sources
        );


        this.loading = false;

      },

      error: (error) => {

        console.error(error);

        this.records = [];

        this.loading = false;

        this.messageService.add({

          severity: 'error',

          summary: this.i18n.t('Error'),

          detail:
            this.i18n.t('Unable to retrieve records.')

        });

      }

    });

  }


  // ============================================================
  // REPORTING DATES
  // ============================================================

  buildReportingDates(
    dates: any[] = []
  ): void {

    this.reportingDates = dates
      .filter(date => date)
      .map(date => {

        const formattedDate =
          new Date(date).toLocaleDateString(
            'en-GB'
          );

        return {

          label: formattedDate,

          value: date

        };

      });
  }


  // ============================================================
  // COUNTRIES
  // ============================================================

  buildCountries(
    countries: any[] = []
  ): void {

    this.countries = [
      ...countries
        .filter(country => country)
        .map(country => ({

          label: country,

          value: country

        }))

    ];

  }


  // ============================================================
  // PORTFOLIOS
  // ============================================================

  buildPortfolios(
    portfolios: any[] = []
  ): void {

    this.portfolios = [
      ...portfolios
        .filter(portfolio => portfolio)
        .map(portfolio => ({

          label: portfolio,

          value: portfolio

        }))

    ];

  }


  // ============================================================
  // PRODUCT TYPES
  // ============================================================

  buildProductTypes(
    products: any[] = []
  ): void {

    this.productTypes = [
      ...products
        .filter(product => product)
        .map(product => ({

          label: product,

          value: product

        }))

    ];

  }


  // ============================================================
  // RISK STAGES
  // ============================================================

  buildRiskStages(
    stages: any[] = []
  ): void {

    this.riskStages = [
      ...stages
        .filter(stage => stage)
        .map(stage => ({

          label: stage,

          value: stage

        }))

    ];

  }


  // ============================================================
  // RATINGS
  // ============================================================

  buildRatings(
    ratings: any[] = []
  ): void {

    this.ratings = [

      ...ratings
        .filter(rating => rating)
        .map(rating => ({

          label: rating,

          value: rating

        }))

    ];

  }


  // ============================================================
  // DATA SOURCES
  // ============================================================

  buildDataSources(
    sources: any[] = []
  ): void {

    this.dataSources = [
      ...sources
        .filter(source => source)
        .map(source => ({

          label: source,

          value: source

        }))

    ];

  }


  // ============================================================
  // TABLE HELPERS
  // ============================================================

  // Color de la etiqueta según el stage (1 verde, 2 ámbar, 3 rojo)
  stageClass(stage: string): string {

    if (stage?.includes('3')) return 'badge badge-red';

    if (stage?.includes('2')) return 'badge badge-amber';

    return 'badge badge-green';

  }


  // "STAGE_2" -> "Stage 2"
  stageLabel(stage: string): string {

    return stage ? stage.replace('STAGE_', 'Stage ') : '-';

  }


  // Selección de registros desde las tarjetas de móvil
  isSelected(record: any): boolean {

    return this.selectedRecords.some(r => r.id === record.id);

  }


  toggleSelection(record: any): void {

    if (this.isSelected(record)) {
      this.selectedRecords = this.selectedRecords.filter(r => r.id !== record.id);
    } else {
      this.selectedRecords = [...this.selectedRecords, record];
    }

  }


  // ============================================================
  // CLEAR FILTERS
  // ============================================================

  clearFilters(): void {

    this.filters = {

      reporting_date: '',

      entity_id: '',

      entity_name: '',

      country: '',

      portfolio: '',

      product_type: '',

      risk_stage: '',

      rating: '',

      default_flag: '',

      data_source: ''

    };

    this.search();

  }


  // ============================================================
  // DELETE SELECTED
  // ============================================================

  deleteSelected(): void {

    if (
      this.selectedRecords.length === 0
    ) {

      return;

    }


    const count =
      this.selectedRecords.length;


    this.confirmationService.confirm({

      message:
        this.i18n.t('Are you sure you want to delete the selected records?') + ` (${count})`,

      header:
        this.i18n.t('Confirm deletion'),

      icon:
        'pi pi-exclamation-triangle',

      acceptButtonStyleClass:
        'p-button-danger',

      rejectButtonStyleClass:
        'p-button-secondary',

      acceptLabel: this.i18n.t('Yes'),

      rejectLabel: this.i18n.t('No'),

      accept: () => {


        const ids =
          this.selectedRecords.map(
            record => record.id
          );


        this.loading = true;


        this.api.deleteRecords(
          ids
        ).subscribe({

          next: (response: any) => {

            this.loading = false;

            this.selectedRecords = [];


            this.messageService.add({

              severity: 'success',

              summary: this.i18n.t('Deleted'),

              detail:
                `${response.recordsDeleted} ${this.i18n.t('record(s) deleted.')}`

            });


            this.search();

          },


          error: (error) => {

            this.loading = false;


            this.messageService.add({

              severity: 'error',

              summary: this.i18n.t('Error'),

              detail:
                error?.error?.message ??
                this.i18n.t('Unable to delete records.')

            });

          }

        });

      }

    });

  }

}