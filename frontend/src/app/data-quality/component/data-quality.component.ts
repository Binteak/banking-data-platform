import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';

import { DataQualityService } from '../service/data-quality.service';


import { TranslatePipe } from '../../i18n/translate.pipe';
import { I18nService } from '../../i18n/i18n.service';
interface Dataset {

  country: string;

  dates: string[];

}


@Component({

  standalone: true,

  selector: 'app-data-quality',

  imports: [

    CommonModule,
    FormsModule,

    CardModule,
    ButtonModule,
    TableModule,
    DividerModule,
    TagModule,
    DropdownModule,
    InputTextModule,
    TranslatePipe

  ],

  templateUrl: './data-quality.component.html',

  styleUrls: ['./data-quality.component.css']

})


export class DataQualityComponent implements OnInit {


  // ==========================================================
  // DATASETS
  // ==========================================================

  datasets: Dataset[] = [];


  // ==========================================================
  // COUNTRIES
  // ==========================================================

  countries: any[] = [];

  selectedCountry = '';


  // ==========================================================
  // DATES
  // ==========================================================

  availableDates: any[] = [];

  selectedReportingDate = '';


  // ==========================================================
  // RESULTS
  // ==========================================================

  results: any[] = [];

  hasExecuted = false;


  // ==========================================================
  // STATE
  // ==========================================================

  loading = false;

  running = false;


  // ==========================================================
  // SUMMARY
  // ==========================================================

  recordsChecked = 0;

  checksExecuted = 0;

  checksPassed = 0;

  checksFailed = 0;

  qualityScore = 0;


  constructor(

    private i18n: I18nService,
    private api: DataQualityService
  ) {}


  // ==========================================================
  // INIT
  // ==========================================================

  ngOnInit(): void {

    this.loadDatasets();

  }


  // ==========================================================
  // LOAD AVAILABLE DATASETS
  // ==========================================================

  loadDatasets(): void {

    this.loading = true;


    this.api.getDatasets()
      .subscribe({

        next: (response: any) => {

          this.datasets =
            response?.datasets ?? [];


          this.countries =
            this.datasets.map(
              dataset => ({
                label: dataset.country,
                value: dataset.country
              })
            );


          this.loading = false;

        },


        error: (error) => {

          console.error(
            'Error loading datasets:',
            error
          );


          this.loading = false;


          alert(
            error?.error?.message ??
            this.i18n.t('Unable to load available datasets.')
          );

        }

      });

  }


  // ==========================================================
  // COUNTRY CHANGE
  // ==========================================================

  onCountryChange(): void {

    this.selectedReportingDate = '';

    this.availableDates = [];

    this.results = [];

    this.hasExecuted = false;

    this.resetSummary();


    if (!this.selectedCountry) {

      return;

    }


    const dataset =
      this.datasets.find(
        item =>
          item.country === this.selectedCountry
      );


    if (!dataset) {

      return;

    }


    this.availableDates =
      dataset.dates.map(
        date => ({
          label: this.formatDate(date),
          value: date
        })
      );

  }


  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  formatDate(date: string): string {

    const parts =
      date.split('-');


    if (parts.length !== 3) {

      return date;

    }


    const year = parts[0];

    const month = parts[1];

    const day = parts[2];


    return `${day}/${month}/${year}`;

  }


  // ==========================================================
  // SELECTED DATASET LABEL
  // ==========================================================

  get selectedDatasetLabel(): string {

    if (
      !this.selectedCountry ||
      !this.selectedReportingDate
    ) {

      return '';

    }


    return `${this.selectedCountry} — ${
      this.formatDate(
        this.selectedReportingDate
      )
    }`;

  }


  // ==========================================================
  // RUN CHECKS
  // ==========================================================

  runChecks(): void {

    if (
      !this.selectedCountry ||
      !this.selectedReportingDate
    ) {

      return;

    }


    this.running = true;

    this.hasExecuted = false;

    this.results = [];

    this.resetSummary();


    this.api.runChecks(
      this.selectedCountry,
      this.selectedReportingDate
    )
    .subscribe({

      next: (response: any) => {

        const summary =
          response?.summary;


        if (summary) {

          this.recordsChecked =
            summary.recordsChecked ?? 0;

          this.checksExecuted =
            summary.checksExecuted ?? 0;

          this.checksPassed =
            summary.checksPassed ?? 0;

          this.checksFailed =
            summary.checksFailed ?? 0;

          this.qualityScore =
            summary.qualityScore ?? 0;

        }


        this.results =
          response?.results ?? [];


        this.hasExecuted = true;

        this.running = false;

      },


      error: (error) => {

        console.error(
          'Error executing data quality:',
          error
        );


        this.running = false;


        alert(
          error?.error?.message ??
          this.i18n.t('Unable to execute data quality checks.')
        );

      }

    });

  }


  // ==========================================================
  // RESET SUMMARY
  // ==========================================================

  private resetSummary(): void {

    this.recordsChecked = 0;

    this.checksExecuted = 0;

    this.checksPassed = 0;

    this.checksFailed = 0;

    this.qualityScore = 0;

  }

}