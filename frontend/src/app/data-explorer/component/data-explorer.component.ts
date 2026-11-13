import { Component, OnInit } from '@angular/core';

import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { SidebarModule } from 'primeng/sidebar';

import { DataExplorerService } from '../service/data-explorer.service';


import { TranslatePipe } from '../../i18n/translate.pipe';
interface RiskExposure {

  id: number;

  reportingDate: string;

  entityId: string;

  entityName: string;

  country: string;

  portfolio: string;

  productType: string;

  exposureAmount: number;

  eadAmount: number;

  pd: number;

  lgd: number;

  riskStage: string;

  rating: string;

  defaultFlag: boolean;

  defaultDate: string | null;

  currency: string;

  dataSource: string;

}


@Component({

  standalone: true,

  selector: 'app-data-explorer',

  imports: [
    CardModule,
    CommonModule,
    ButtonModule,
    DividerModule,
    InputTextModule,
    TableModule,
   
    DropdownModule,
    FormsModule,
    SidebarModule,
    TranslatePipe
  ],

  templateUrl: './data-explorer.component.html',

  styleUrls: ['./data-explorer.component.css']

})


export class DataExplorerComponent implements OnInit {


  // ==========================================================
  // DATA
  // ==========================================================

  tableData: RiskExposure[] = [];

  filteredData: RiskExposure[] = [];

  loading: boolean = false;

  errorMessage: string = '';


  // ==========================================================
  // FILTERS
  // ==========================================================

  searchText: string = '';

  selectedReportingDate: string = '';

  selectedCountry: string = '';

  selectedPortfolio: string = '';

  selectedProductType: string = '';

  selectedRiskStage: string = '';

  selectedRating: string = '';

  selectedDefault: string = '';

  selectedDataSource: string = '';

  // En móvil los filtros secundarios van plegados
  showAllFilters: boolean = false;


  // ==========================================================
  // FILTER OPTIONS
  // ==========================================================

  reportingDates: string[] = [];

  countries: string[] = [];

  portfolios: string[] = [];

  productTypes: string[] = [];

  riskStages: string[] = [];

  ratings: string[] = [];

  dataSources: string[] = [];


  defaultOptions = [
    {
      label: 'Default',
      value: 'true'
    },
    {
      label: 'Non Default',
      value: 'false'
    }
  ];


  // ==========================================================
  // DETAIL PANEL + MOBILE LIST
  // ==========================================================

  selectedRow: RiskExposure | null = null;

  showDetail: boolean = false;

  detailPosition: string = 'right';

  // En móvil se muestran tarjetas de 10 en 10
  mobileLimit: number = 10;


  constructor(
    private _api: DataExplorerService
  ) {}


  ngOnInit(): void {

    this.getDataTable();

  }


  // ==========================================================
  // LOAD DATA
  // ==========================================================

  getDataTable(): void {

    this.loading = true;

    this.errorMessage = '';


    this._api.getDataTable().subscribe({

      next: (res: any) => {

        console.log('Data Explorer response:', res);


        if (res.status === 'success') {

          this.tableData = res.data;

          this.filteredData = [...this.tableData];

          this.buildFilterOptions();

        } else {

          this.errorMessage =
            res.message || 'Unable to load data.';

        }


        this.loading = false;

      },

      error: (error) => {

        console.error(
          'Error loading Data Explorer:',
          error
        );

        this.errorMessage =
          'Unable to load risk exposure data.';

        this.loading = false;

      }

    });

  }


  // ==========================================================
  // BUILD FILTER OPTIONS
  // ==========================================================

  buildFilterOptions(): void {

    this.reportingDates = this.getUniqueValues(
      this.tableData.map(x => x.reportingDate)
    );

    this.countries = this.getUniqueValues(
      this.tableData.map(x => x.country)
    );

    this.portfolios = this.getUniqueValues(
      this.tableData.map(x => x.portfolio)
    );

    this.productTypes = this.getUniqueValues(
      this.tableData.map(x => x.productType)
    );

    this.riskStages = this.getUniqueValues(
      this.tableData.map(x => x.riskStage)
    );

    this.ratings = this.getUniqueValues(
      this.tableData.map(x => x.rating)
    );

    this.dataSources = this.getUniqueValues(
      this.tableData.map(x => x.dataSource)
    );

  }


  getUniqueValues(values: any[]): string[] {

    return values
      .filter(value => value !== null && value !== undefined && value !== '')
      .map(value => String(value))
      .filter(
        (value, index, self) =>
          self.indexOf(value) === index
      )
      .sort((a, b) => String(a).localeCompare(String(b)));

  }


  // ==========================================================
  // APPLY FILTERS
  // ==========================================================

  applyFilters(): void {

    this.mobileLimit = 10;

    const search = this.searchText
      .trim()
      .toLowerCase();


    this.filteredData = this.tableData.filter(row => {


      // General search

      const matchesSearch =
        !search ||
        row.entityId?.toLowerCase().includes(search) ||
        row.entityName?.toLowerCase().includes(search) ||
        row.country?.toLowerCase().includes(search) ||
        row.portfolio?.toLowerCase().includes(search) ||
        row.productType?.toLowerCase().includes(search) ||
        row.rating?.toLowerCase().includes(search) ||
        row.dataSource?.toLowerCase().includes(search);


      // Reporting date

      const matchesDate =
        !this.selectedReportingDate ||
        row.reportingDate === this.selectedReportingDate;


      // Country

      const matchesCountry =
        !this.selectedCountry ||
        row.country === this.selectedCountry;


      // Portfolio

      const matchesPortfolio =
        !this.selectedPortfolio ||
        row.portfolio === this.selectedPortfolio;


      // Product

      const matchesProduct =
        !this.selectedProductType ||
        row.productType === this.selectedProductType;


      // Risk stage

      const matchesStage =
        !this.selectedRiskStage ||
        row.riskStage === this.selectedRiskStage;


      // Rating

      const matchesRating =
        !this.selectedRating ||
        row.rating === this.selectedRating;


      // Default

      const matchesDefault =
        !this.selectedDefault ||
        String(row.defaultFlag) === this.selectedDefault;


      // Data source

      const matchesSource =
        !this.selectedDataSource ||
        row.dataSource === this.selectedDataSource;


      return (
        matchesSearch &&
        matchesDate &&
        matchesCountry &&
        matchesPortfolio &&
        matchesProduct &&
        matchesStage &&
        matchesRating &&
        matchesDefault &&
        matchesSource
      );

    });

  }


  // ==========================================================
  // CLEAR FILTERS
  // ==========================================================

  clearFilters(): void {

    this.searchText = '';

    this.selectedReportingDate = '';

    this.selectedCountry = '';

    this.selectedPortfolio = '';

    this.selectedProductType = '';

    this.selectedRiskStage = '';

    this.selectedRating = '';

    this.selectedDefault = '';

    this.selectedDataSource = '';

    this.filteredData = [...this.tableData];

  }


  // ==========================================================
  // REFRESH
  // ==========================================================

  refreshData(): void {

  // Limpiar filtros
  this.searchText = '';
  this.selectedReportingDate = '';
  this.selectedCountry = '';
  this.selectedPortfolio = '';
  this.selectedProductType = '';
  this.selectedRiskStage = '';
  this.selectedRating = '';
  this.selectedDefault = '';
  this.selectedDataSource = '';

  // Recargar datos
  this.getDataTable();

}


  // ==========================================================
  // SUMMARY
  // ==========================================================

  get totalRecords(): number {

    return this.filteredData.length;

  }


  get defaultedRecords(): number {

    return this.filteredData.filter(
      row => row.defaultFlag
    ).length;

  }


  get totalExposure(): number {

    return this.filteredData.reduce(
      (total, row) =>
        total + Number(row.exposureAmount || 0),
      0
    );

  }


  get totalEad(): number {

    return this.filteredData.reduce(
      (total, row) =>
        total + Number(row.eadAmount || 0),
      0
    );

  }


  // ==========================================================
  // TABLE HELPERS
  // ==========================================================

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


  get averagePd(): number {

    if (!this.filteredData.length) return 0;

    return this.filteredData.reduce(
      (total, row) => total + Number(row.pd || 0), 0
    ) / this.filteredData.length;

  }


  get averageLgd(): number {

    if (!this.filteredData.length) return 0;

    return this.filteredData.reduce(
      (total, row) => total + Number(row.lgd || 0), 0
    ) / this.filteredData.length;

  }


  // Filtros activos que se muestran como chips encima de la tabla
  get activeFilters(): { name: string, value: string, key: string }[] {

    const filters = [
      { label: 'Search', key: 'searchText' },
      { label: 'Date', key: 'selectedReportingDate' },
      { label: 'Country', key: 'selectedCountry' },
      { label: 'Portfolio', key: 'selectedPortfolio' },
      { label: 'Product', key: 'selectedProductType' },
      { label: 'Stage', key: 'selectedRiskStage' },
      { label: 'Rating', key: 'selectedRating' },
      { label: 'Default', key: 'selectedDefault' },
      { label: 'Source', key: 'selectedDataSource' }
    ];

    return filters
      .filter(f => (this as any)[f.key])
      .map(f => ({
        key: f.key,
        name: f.label,
        value: this.filterValueLabel(f.key)
      }));

  }


  // Filtros secundarios aplicados (se muestra en el botón "Más filtros")
  get secondaryFilterCount(): number {

    return this.activeFilters.filter(f => f.key !== 'searchText').length;

  }


  filterValueLabel(key: string): string {

    const value = (this as any)[key];

    if (key === 'selectedDefault') {
      return value === 'true' ? 'Yes' : 'No';
    }

    return value;

  }


  removeFilter(key: string): void {

    (this as any)[key] = '';

    this.applyFilters();

  }


  openDetail(row: RiskExposure): void {

    this.selectedRow = row;

    // En pantallas pequeñas el panel sale desde abajo
    this.detailPosition = window.innerWidth <= 768 ? 'bottom' : 'right';

    this.showDetail = true;

  }


  // ==========================================================
  // EXPORT CSV
  // ==========================================================

  exportCSV(): void {

    if (!this.filteredData.length) {

      return;

    }


    const headers = [
      'ID',
      'Reporting Date',
      'Entity ID',
      'Entity Name',
      'Country',
      'Portfolio',
      'Product Type',
      'Exposure Amount',
      'EAD Amount',
      'PD',
      'LGD',
      'Risk Stage',
      'Rating',
      'Default',
      'Default Date',
      'Currency',
      'Data Source'
    ];


    const rows = this.filteredData.map(row => [

      row.id,
      row.reportingDate,
      row.entityId,
      row.entityName,
      row.country,
      row.portfolio,
      row.productType,
      row.exposureAmount,
      row.eadAmount,
      row.pd,
      row.lgd,
      row.riskStage,
      row.rating,
      row.defaultFlag,
      row.defaultDate || '',
      row.currency,
      row.dataSource

    ]);


    const csvContent = [

      headers.join(','),

      ...rows.map(row =>
        row
          .map(value => this.escapeCSV(value))
          .join(',')
      )

    ].join('\n');


    const blob = new Blob(
      [csvContent],
      {
        type: 'text/csv;charset=utf-8;'
      }
    );


    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');

    link.href = url;

    link.download =
      `risk_exposures_${this.getFileDate()}.csv`;

    link.click();

    URL.revokeObjectURL(url);

  }


  escapeCSV(value: any): string {

    if (value === null || value === undefined) {

      return '';

    }


    const stringValue = String(value);


    if (
      stringValue.includes(',') ||
      stringValue.includes('"') ||
      stringValue.includes('\n')
    ) {

      return `"${stringValue.replace(/"/g, '""')}"`;

    }


    return stringValue;

  }


  getFileDate(): string {

    const date = new Date();

    return date
      .toISOString()
      .substring(0, 10);

  }

}