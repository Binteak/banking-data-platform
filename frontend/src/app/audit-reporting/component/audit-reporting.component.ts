import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
  ReportingService
} from '../service/audit-reporting.service';


import { TranslatePipe } from '../../i18n/translate.pipe';
import { I18nService } from '../../i18n/i18n.service';
@Component({

  standalone: true,

  selector: 'app-reporting',

  imports: [

    CommonModule,
    FormsModule,

    CardModule,
    ButtonModule,
    TableModule,
    DividerModule,
    InputTextModule,
    DropdownModule,
    TagModule,
    DialogModule,
    TranslatePipe

  ],

  templateUrl:
    './audit-reporting.component.html',

  styleUrls: [
    './audit-reporting.component.css'
  ]

})


export class ReportingComponent
  implements OnInit {


  // ==========================================================
  // REPORT INFORMATION
  // ==========================================================

  reportName = '';

  reportingDate = '';

  country = '';

  portfolio = '';

  productType = '';

  riskStage = '';

  rating = '';

  defaultStatus = '';


  // ==========================================================
  // DATA
  // ==========================================================

  reports: any[] = [];

  selectedMetrics: any = null;

  selectedMetricDetails: any = null;


  // ==========================================================
  // STATES
  // ==========================================================

  loading = false;

  generating = false;

  generatingPdf = false;

  exportingData = false;

  loadingFilters = false;

  showDetailsDialog = false;


  // ==========================================================
  // DYNAMIC OPTIONS
  // ==========================================================

  reportingDates: any[] = [];

  countries: any[] = [];

  portfolios: any[] = [];

  productTypes: any[] = [];

  riskStages: any[] = [];

  ratings: any[] = [];

  defaultStatuses: any[] = [];


  // ==========================================================
  // INIT
  // ==========================================================

  ngOnInit(): void {

    this.loadReports();

    this.loadFilters();

  }


  // ==========================================================
  // REPORT GROUPS (vista móvil: una tarjeta por informe)
  // ==========================================================

  get reportGroups(): any[] {

    const groups: any[] = [];

    for (const row of this.reports) {

      let group = groups.find(g => g.name === row.report_name);

      if (!group) {
        group = {
          name: row.report_name,
          country: row.country,
          date: row.reporting_date,
          metrics: []
        };
        groups.push(group);
      }

      group.metrics.push(row);

    }

    return groups;

  }


  // ==========================================================
  // LOAD REPORT HISTORY
  // ==========================================================

  loadReports(): void {

    this.loading = true;

    this.api.getReports()
      .subscribe({

        next: (response: any) => {

          this.reports =
            response?.data ?? [];

          this.loading = false;

        },

        error: error => {

          console.error(
            'Error loading reporting results:',
            error
          );

          this.loading = false;

        }

      });

  }


  // ==========================================================
  // CURRENT FILTERS
  // ==========================================================

  private getCurrentFilters(): any {

    return {

      reportingDate:
        this.reportingDate,

      country:
        this.country,

      portfolio:
        this.portfolio,

      productType:
        this.productType,

      riskStage:
        this.riskStage,

      rating:
        this.rating,

      defaultStatus:
        this.defaultStatus

    };

  }


  // ==========================================================
  // DYNAMIC FILTERS
  // ==========================================================

  loadFilters(): void {

    this.loadingFilters = true;

    this.api.getFilters(
      this.getCurrentFilters()
    )
    .subscribe({

      next: (response: any) => {

        const filters =
          response?.filters ?? {};


        this.reportingDates =
          (filters.reportingDates ?? [])
            .map((value: string) => ({
              label: value,
              value
            }));


        this.countries =
          (filters.countries ?? [])
            .map((value: string) => ({
              label: this.countryLabel(value),
              value
            }));


        this.portfolios =
          (filters.portfolios ?? [])
            .map((value: string) => ({
              label: this.formatOption(value),
              value
            }));


        this.productTypes =
          (filters.productTypes ?? [])
            .map((value: string) => ({
              label: this.formatOption(value),
              value
            }));


        this.riskStages =
          (filters.riskStages ?? [])
            .map((value: string) => ({
              label: this.formatOption(value),
              value
            }));


        this.ratings =
          (filters.ratings ?? [])
            .map((value: string) => ({
              label: value,
              value
            }));


        this.defaultStatuses =
          (filters.defaultStatuses ?? [])
            .map((value: string) => ({

              label:
                value === 'DEFAULT'
                  ? 'Defaulted'
                  : 'Non-defaulted',

              value

            }));


        this.loadingFilters = false;

      },

      error: error => {

        console.error(
          'Error loading dynamic filters:',
          error
        );

        this.loadingFilters = false;

      }

    });

  }


  // ==========================================================
  // FILTER CHANGE
  // ==========================================================

  onFilterChange(): void {

    this.loadFilters();

  }


  // ==========================================================
  // CALCULATE METRICS
  // ==========================================================

  calculateMetrics(): void {

    if (!this.reportName.trim()) {

      alert(
        this.i18n.t('Please enter a report name.')
      );

      return;

    }


    if (!this.reportingDate) {

      alert(
        this.i18n.t('Please select a reporting date.')
      );

      return;

    }


    if (!this.country) {

      alert(
        this.i18n.t('Please select a country.')
      );

      return;

    }


    this.generating = true;


    const filters = {

      report_name:
        this.reportName.trim(),

      reporting_date:
        this.reportingDate,

      country:
        this.country,

      portfolio:
        this.portfolio || null,

      product_type:
        this.productType || null,

      risk_stage:
        this.riskStage || null,

      rating:
        this.rating || null,

      default_status:
        this.defaultStatus || null

    };


    this.api.generateReport(filters)
      .subscribe({

        next: (response: any) => {

          this.generating = false;


          if (
            response?.status === 'success'
          ) {

            this.selectedMetrics =
              response.report;


            this.loadReports();

          }

        },

        error: error => {

          console.error(
            'Error generating metrics:',
            error
          );

          this.generating = false;

          alert(
            error?.error?.message ??
            this.i18n.t('Unable to calculate reporting metrics.')
          );

        }

      });

  }


  // ==========================================================
  // FILTROS EN MÓVIL
  // ==========================================================

  // En móvil los filtros secundarios van plegados
  showAllFilters: boolean = false;


  // Filtros secundarios aplicados (se muestra en el botón "Más filtros")
  get secondaryFilterCount(): number {

    return [
      this.portfolio,
      this.productType,
      this.riskStage,
      this.rating,
      this.defaultStatus
    ].filter(value => !!value).length;

  }


  // ==========================================================
  // RESET
  // ==========================================================

  resetFilters(): void {

    this.reportName = '';

    this.reportingDate = '';

    this.country = '';

    this.portfolio = '';

    this.productType = '';

    this.riskStage = '';

    this.rating = '';

    this.defaultStatus = '';

    this.selectedMetrics = null;

    this.loadFilters();

  }


  // ==========================================================
  // SHOW METRIC DETAILS
  // ==========================================================

  showMetricDetails(
    report: any
  ): void {

    this.selectedMetricDetails =
      report;

    this.showDetailsDialog = true;

  }


  // ==========================================================
  // QUALITY STATUS
  // ==========================================================

  getQualityLabel(): string {

    if (!this.selectedMetrics) {

      return '';

    }


    switch (
      this.selectedMetrics.qualityStatus
    ) {

      case 'PASSED':
        return 'Validated';

      case 'FAILED':
        return 'Not validated';

      default:
        return 'Not available';

    }

  }


  getQualitySeverity():
    'success' |
    'secondary' |
    'info' |
    'warning' |
    'danger' |
    'contrast' |
    undefined {

    if (!this.selectedMetrics) {

      return undefined;

    }


    switch (
      this.selectedMetrics.qualityStatus
    ) {

      case 'PASSED':
        return 'success';

      case 'FAILED':
        return 'danger';

      default:
        return 'warning';

    }

  }


  // ==========================================================
  // EXPORT FILTERED DATA
  // ==========================================================

  exportFilteredData(): void {

    if (!this.reportingDate) {

      alert(
        this.i18n.t('Please select a reporting date.')
      );

      return;

    }


    if (!this.country) {

      alert(
        this.i18n.t('Please select a country.')
      );

      return;

    }


    this.exportingData = true;


    this.api.exportFilteredData(
      this.getCurrentFilters()
    )
    .subscribe({

      next: blob => {

        const url =
          window.URL.createObjectURL(blob);


        const link =
          document.createElement('a');


        link.href = url;


        link.download =
          `${this.reportName || 'filtered_exposures'}.csv`;


        link.click();


        window.URL.revokeObjectURL(url);


        this.exportingData = false;

      },

      error: error => {

        console.error(
          'Export error:',
          error
        );

        this.exportingData = false;

        alert(
          this.i18n.t('Unable to export filtered exposure data.')
        );

      }

    });

  }


  // ==========================================================
  // GENERATE PDF
  // ==========================================================

  generatePDF(): void {

    if (!this.selectedMetrics) {

      alert(
        this.i18n.t('Calculate the metrics before generating the PDF.')
      );

      return;

    }


    this.generatingPdf = true;


    try {

      const pdf =
        new jsPDF(
          'p',
          'mm',
          'a4'
        );


      const width =
        pdf.internal.pageSize.getWidth();


      const height =
        pdf.internal.pageSize.getHeight();


      const margin = 18;


      // ======================================================
      // HEADER
      // ======================================================

      pdf.setFillColor(
        35,
        35,
        35
      );


      pdf.rect(
        0,
        0,
        width,
        34,
        'F'
      );


      pdf.setTextColor(
        255,
        255,
        255
      );


      pdf.setFont(
        'helvetica',
        'bold'
      );


      pdf.setFontSize(16);


      pdf.text(
        'BANKING DATA PLATFORM',
        margin,
        13
      );


      pdf.setFontSize(9);


      pdf.setFont(
        'helvetica',
        'normal'
      );


      pdf.text(
        'RISK REPORTING',
        margin,
        21
      );


      pdf.text(
        'CONFIDENTIAL',
        width - margin,
        13,
        {
          align: 'right'
        }
      );


      // ======================================================
      // REPORT TITLE
      // ======================================================

      let y = 47;


      pdf.setTextColor(
        40,
        40,
        40
      );


      pdf.setFont(
        'helvetica',
        'bold'
      );


      pdf.setFontSize(16);


      pdf.text(
        this.selectedMetrics.reportName ||
        this.reportName,
        margin,
        y
      );


      y += 9;


      pdf.setFontSize(9);


      pdf.setFont(
        'helvetica',
        'normal'
      );


      pdf.text(
        `Reporting date: ${this.reportingDate}`,
        margin,
        y
      );


      pdf.text(
        `Generated: ${new Date().toLocaleString()}`,
        width - margin,
        y,
        {
          align: 'right'
        }
      );


      // ======================================================
      // DATA QUALITY VALIDATION
      // ======================================================

      y += 14;


      pdf.setFont(
        'helvetica',
        'bold'
      );


      pdf.setFontSize(11);


      pdf.setTextColor(
        40,
        40,
        40
      );


      pdf.text(
        'DATA QUALITY VALIDATION',
        margin,
        y
      );


      y += 7;


      const qualityStatus =
        this.selectedMetrics.qualityStatus;


      let qualityLabel =
        this.getQualityLabel();


      if (!qualityLabel) {

        qualityLabel =
          'Not available';

      }


      if (qualityStatus === 'PASSED') {

        pdf.setTextColor(
          20,
          120,
          60
        );

      } else if (
        qualityStatus === 'FAILED'
      ) {

        pdf.setTextColor(
          180,
          30,
          30
        );

      } else {

        pdf.setTextColor(
          180,
          110,
          20
        );

      }


      pdf.setFont(
        'helvetica',
        'bold'
      );


      pdf.setFontSize(10);


      pdf.text(
        qualityLabel.toUpperCase(),
        margin,
        y
      );


      pdf.setTextColor(
        40,
        40,
        40
      );


      y += 7;


      pdf.setFont(
        'helvetica',
        'normal'
      );


      pdf.setFontSize(8);


      const qualityRows = [

        [
          'Country',
          this.country || 'ALL'
        ],

        [
          'Reporting date',
          this.reportingDate
        ],

        [
          'Validation status',
          qualityLabel
        ],

        [
          'Records analysed',
          String(
            this.selectedMetrics.recordsAnalysed ??
            this.selectedMetrics.metrics?.exposureCount ??
            0
          )
        ],

        [
          'Failed quality checks',
          String(
            this.selectedMetrics.failedQualityChecks ??
            0
          )
        ],

        [
          'Quality score',
          this.selectedMetrics.qualityScore != null
            ? `${Number(this.selectedMetrics.qualityScore).toFixed(1)}%`
            : 'Not available'
        ],

      ];


      autoTable(pdf, {

        startY: y,

        margin: {
          left: margin,
          right: margin
        },

        head: [
          [
            'Data Quality Parameter',
            'Result'
          ]
        ],

        body: qualityRows,

        theme: 'grid',

        styles: {
          fontSize: 8,
          cellPadding: 3
        },

        headStyles: {

          fillColor: [
            55,
            55,
            55
          ],

          textColor: [
            255,
            255,
            255
          ],

          fontStyle: 'bold'

        }

      });


      // ======================================================
      // REPORTING UNIVERSE
      // ======================================================

      let universeY =
        (pdf as any)
          .lastAutoTable
          .finalY + 14;


      if (
        universeY >
        height - 80
      ) {

        pdf.addPage();

        universeY = 20;

      }


      pdf.setTextColor(
        40,
        40,
        40
      );


      pdf.setFont(
        'helvetica',
        'bold'
      );


      pdf.setFontSize(11);


      pdf.text(
        'REPORTING UNIVERSE',
        margin,
        universeY
      );


      universeY += 7;


      const filterRows = [

        [
          'Reporting date',
          this.reportingDate
        ],

        [
          'Country',
          this.country || 'ALL'
        ],

        [
          'Portfolio',
          this.portfolio || 'ALL'
        ],

        [
          'Product type',
          this.productType || 'ALL'
        ],

        [
          'Risk stage',
          this.riskStage || 'ALL'
        ],

        [
          'Rating',
          this.rating || 'ALL'
        ],

        [
          'Default status',
          this.defaultStatus || 'ALL'
        ],

        [
          'Records analysed',
          this.selectedMetrics.recordsAnalysed ??
          this.selectedMetrics.metrics?.exposureCount ??
          0
        ]

      ];


      autoTable(pdf, {

        startY: universeY,

        margin: {
          left: margin,
          right: margin
        },

        head: [
          [
            'Parameter',
            'Selected value'
          ]
        ],

        body: filterRows,

        theme: 'grid',

        styles: {
          fontSize: 8,
          cellPadding: 3
        },

        headStyles: {

          fillColor: [
            55,
            55,
            55
          ],

          textColor: [
            255,
            255,
            255
          ],

          fontStyle: 'bold'

        }

      });


      // ======================================================
      // METRICS
      // ======================================================

      let metricsY =
        (pdf as any)
          .lastAutoTable
          .finalY + 14;


      if (
        metricsY >
        height - 70
      ) {

        pdf.addPage();

        metricsY = 20;

      }


      pdf.setTextColor(
        40,
        40,
        40
      );


      pdf.setFont(
        'helvetica',
        'bold'
      );


      pdf.setFontSize(13);


      pdf.text(
        'RISK METRICS',
        margin,
        metricsY
      );


      metricsY += 5;


      const metricRows = [

        [
          'Exposure count',

          this.selectedMetrics.metrics.exposureCount,

          'Number of exposure records included in the selected reporting universe.'
        ],

        [
          'Total exposure',

          this.formatCurrency(
            this.selectedMetrics.metrics.totalExposure
          ),

          'Total exposure amount for the selected reporting universe.'
        ],

        [
          'Total EAD',

          this.formatCurrency(
            this.selectedMetrics.metrics.totalEad
          ),

          'Total Exposure at Default for the selected reporting universe.'
        ],

        [
          'Average PD',

          this.formatPercentage(
            this.selectedMetrics.metrics.averagePd
          ),

          'Average Probability of Default across the selected exposures.'
        ],

        [
          'Average LGD',

          this.formatPercentage(
            this.selectedMetrics.metrics.averageLgd
          ),

          'Average Loss Given Default across the selected exposures.'
        ],

        [
          'Default rate',

          this.formatPercentage(
            this.selectedMetrics.metrics.defaultRate
          ),

          'Percentage of exposures currently classified as defaulted.'
        ],

        [
          'Expected loss',

          this.formatCurrency(
            this.selectedMetrics.metrics.expectedLoss
          ),

          'Expected loss calculated as EAD multiplied by PD and LGD.'
        ]

      ];


      autoTable(pdf, {

        startY: metricsY,

        margin: {
          left: margin,
          right: margin
        },

        head: [
          [
            'Metric',
            'Calculated value',
            'Definition'
          ]
        ],

        body: metricRows,

        theme: 'grid',

        styles: {
          fontSize: 8,
          cellPadding: 4,
          valign: 'top'
        },

        columnStyles: {

          0: {
            cellWidth: 38
          },

          1: {
            cellWidth: 40
          },

          2: {
            cellWidth: 'auto'
          }

        },

        headStyles: {

          fillColor: [
            55,
            55,
            55
          ],

          textColor: [
            255,
            255,
            255
          ],

          fontStyle: 'bold'

        }

      });


      // ======================================================
      // METHODOLOGY
      // ======================================================

      let finalY =
        (pdf as any)
          .lastAutoTable
          .finalY + 15;


      if (
        finalY >
        height - 45
      ) {

        pdf.addPage();

        finalY = 20;

      }


      pdf.setFont(
        'helvetica',
        'bold'
      );


      pdf.setFontSize(11);


      pdf.setTextColor(
        40,
        40,
        40
      );


      pdf.text(
        'METHODOLOGY',
        margin,
        finalY
      );


      finalY += 7;


      pdf.setFont(
        'helvetica',
        'normal'
      );


      pdf.setFontSize(8);


      pdf.text(
        'Metrics are calculated from the selected risk exposure universe using',
        margin,
        finalY
      );


      finalY += 5;


      pdf.text(
        'the reporting date and the selected reporting filters.',
        margin,
        finalY
      );


      finalY += 5;


      pdf.text(
        'Expected Loss = EAD × PD × LGD.',
        margin,
        finalY
      );


      // ======================================================
      // FOOTER
      // ======================================================

      const pages =
        (pdf.internal as any)
          .getNumberOfPages();


      for (
        let page = 1;
        page <= pages;
        page++
      ) {

        pdf.setPage(page);


        pdf.setFontSize(7);


        pdf.setFont(
          'helvetica',
          'normal'
        );


        pdf.setTextColor(
          120,
          120,
          120
        );


        pdf.line(
          margin,
          height - 13,
          width - margin,
          height - 13
        );


        pdf.text(
          'Banking Data Platform',
          margin,
          height - 7
        );


        pdf.text(
          'CONFIDENTIAL',
          width / 2,
          height - 7,
          {
            align: 'center'
          }
        );


        pdf.text(
          `Page ${page} of ${pages}`,
          width - margin,
          height - 7,
          {
            align: 'right'
          }
        );

      }


      // ======================================================
      // DOWNLOAD
      // ======================================================

      const fileName =
        `${this.reportName
          .replace(
            /[^a-zA-Z0-9-_]/g,
            '_'
          )}.pdf`;


      pdf.save(fileName);

    } catch (error) {

      console.error(
        'PDF generation error:',
        error
      );

      alert(
        this.i18n.t('Unable to generate the PDF.')
      );

    } finally {

      this.generatingPdf = false;

    }

  }


  // ==========================================================
  // FORMAT CURRENCY
  // ==========================================================

  formatCurrency(
    value: number
  ): string {

    return new Intl.NumberFormat(
      'en-GB',
      {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 2
      }
    ).format(value);

  }


  // ==========================================================
  // FORMAT PERCENTAGE
  // ==========================================================

  formatPercentage(
    value: number
  ): string {

    return `${
      (value * 100).toFixed(2)
    }%`;

  }


  // ==========================================================
  // FORMAT OPTION
  // ==========================================================

  formatOption(
    value: string
  ): string {

    if (!value) {

      return '';

    }


    return value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(
        /\b\w/g,
        char => char.toUpperCase()
      );

  }


  // ==========================================================
  // COUNTRY LABEL
  // ==========================================================

  countryLabel(
    value: string
  ): string {

    const countries: any = {

      ES: 'Spain',
      FR: 'France',
      DE: 'Germany',
      PT: 'Portugal',
      IE: 'Ireland',
      BE: 'Belgium',
      NL: 'Netherlands',
      IT: 'Italy',
      CO: 'Colombia'

    };


    return countries[value] ?? value;

  }


  // ==========================================================
  // METRIC LABEL
  // ==========================================================

  metricLabel(
    metric: string
  ): string {

    const labels: any = {

      EXPOSURE_COUNT:
        'Exposure Count',

      TOTAL_EXPOSURE:
        'Total Exposure',

      TOTAL_EAD:
        'Total EAD',

      AVERAGE_PD:
        'Average PD',

      AVERAGE_LGD:
        'Average LGD',

      DEFAULT_RATE:
        'Default Rate',

      EXPECTED_LOSS:
        'Expected Loss'

    };


    return labels[metric] ?? metric;

  }


  // ==========================================================
  // METRIC DISPLAY VALUE
  // ==========================================================

  metricDisplayValue(
    report: any
  ): string {

    const metric =
      report.metric_name;


    const value =
      Number(
        report.metric_value
      );


    switch (metric) {

      case 'EXPOSURE_COUNT':

        return value.toLocaleString();


      case 'TOTAL_EXPOSURE':

      case 'TOTAL_EAD':

      case 'EXPECTED_LOSS':

        return this.formatCurrency(
          value
        );


      case 'AVERAGE_PD':

      case 'AVERAGE_LGD':

      case 'DEFAULT_RATE':

        return this.formatPercentage(
          value
        );


      default:

        return value.toLocaleString();

    }

  }


  // ==========================================================
  // CONSTRUCTOR
  // ==========================================================

  constructor(

    private i18n: I18nService,
    private api: ReportingService
  ) {}

}