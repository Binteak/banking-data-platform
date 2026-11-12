// import { Injectable } from '@angular/core';
// import { Observable, of } from 'rxjs';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReportingServiceProd {

  // ==========================================================
  // MOCK DATA
  // ==========================================================

  private mockReports: any[] = [
    {
      id: 1,
      reporting_date: '2026-06-30',
      report_name: 'June 2026 Colombia Risk Report',
      metric_name: 'EXPOSURE_COUNT',
      metric_value: 6,
      portfolio: 'CORPORATE',
      country: 'CO',
      product_type: 'LOAN',
      risk_stage: 'STAGE_2',
      rating: 'BBB',
      default_status: 'ALL',
      records_analysed: 6,
      execution_date: '2026-06-30T10:30:00',
      details:
        'Number of exposure records included in the selected reporting universe.'
    },
    {
      id: 2,
      reporting_date: '2026-06-30',
      report_name: 'June 2026 Colombia Risk Report',
      metric_name: 'TOTAL_EXPOSURE',
      metric_value: 1250000,
      portfolio: 'CORPORATE',
      country: 'CO',
      product_type: 'LOAN',
      risk_stage: 'STAGE_2',
      rating: 'BBB',
      default_status: 'ALL',
      records_analysed: 6,
      execution_date: '2026-06-30T10:30:00',
      details:
        'Total exposure amount for the selected reporting universe.'
    },
    {
      id: 3,
      reporting_date: '2026-06-30',
      report_name: 'June 2026 Colombia Risk Report',
      metric_name: 'TOTAL_EAD',
      metric_value: 980000,
      portfolio: 'CORPORATE',
      country: 'CO',
      product_type: 'LOAN',
      risk_stage: 'STAGE_2',
      rating: 'BBB',
      default_status: 'ALL',
      records_analysed: 6,
      execution_date: '2026-06-30T10:30:00',
      details:
        'Total Exposure at Default for the selected reporting universe.'
    },
    {
      id: 4,
      reporting_date: '2026-06-30',
      report_name: 'June 2026 Colombia Risk Report',
      metric_name: 'AVERAGE_PD',
      metric_value: 0.0435,
      portfolio: 'CORPORATE',
      country: 'CO',
      product_type: 'LOAN',
      risk_stage: 'STAGE_2',
      rating: 'BBB',
      default_status: 'ALL',
      records_analysed: 6,
      execution_date: '2026-06-30T10:30:00',
      details:
        'Average Probability of Default across the selected exposures.'
    },
    {
      id: 5,
      reporting_date: '2026-06-30',
      report_name: 'June 2026 Colombia Risk Report',
      metric_name: 'AVERAGE_LGD',
      metric_value: 0.38,
      portfolio: 'CORPORATE',
      country: 'CO',
      product_type: 'LOAN',
      risk_stage: 'STAGE_2',
      rating: 'BBB',
      default_status: 'ALL',
      records_analysed: 6,
      execution_date: '2026-06-30T10:30:00',
      details:
        'Average Loss Given Default across the selected exposures.'
    },
    {
      id: 6,
      reporting_date: '2026-06-30',
      report_name: 'June 2026 Colombia Risk Report',
      metric_name: 'DEFAULT_RATE',
      metric_value: 0.1667,
      portfolio: 'CORPORATE',
      country: 'CO',
      product_type: 'LOAN',
      risk_stage: 'STAGE_2',
      rating: 'BBB',
      default_status: 'ALL',
      records_analysed: 6,
      execution_date: '2026-06-30T10:30:00',
      details:
        'Percentage of exposures currently classified as defaulted.'
    },
    {
      id: 7,
      reporting_date: '2026-06-30',
      report_name: 'June 2026 Colombia Risk Report',
      metric_name: 'EXPECTED_LOSS',
      metric_value: 16000,
      portfolio: 'CORPORATE',
      country: 'CO',
      product_type: 'LOAN',
      risk_stage: 'STAGE_2',
      rating: 'BBB',
      default_status: 'ALL',
      records_analysed: 6,
      execution_date: '2026-06-30T10:30:00',
      details:
        'Expected loss calculated as EAD multiplied by PD and LGD.'
    }
  ];


  // ==========================================================
  // MOCK FILTERS
  // ==========================================================

  private mockFilters = {

    reportingDates: [
      '2026-06-30',
      '2026-05-31',
      '2026-04-30'
    ],

    countries: [
      'CO',
      'ES',
      'FR',
      'DE'
    ],

    portfolios: [
      'CORPORATE',
      'RETAIL',
      'SME'
    ],

    productTypes: [
      'LOAN',
      'MORTGAGE',
      'CREDIT_CARD'
    ],

    riskStages: [
      'STAGE_1',
      'STAGE_2',
      'STAGE_3'
    ],

    ratings: [
      'AAA',
      'AA',
      'A',
      'BBB',
      'BB',
      'B'
    ],

    defaultStatuses: [
      'DEFAULT',
      'NON_DEFAULT'
    ]
  };


  // ==========================================================
  // GET REPORTS
  // ==========================================================

  getReports(): Observable<any> {

    return of({
      status: 'success',
      data: this.mockReports
    });

  }


  // ==========================================================
  // GET FILTERS
  // ==========================================================

  getFilters(filters: any): Observable<any> {

    return of({
      status: 'success',
      filters: this.mockFilters
    });

  }


  // ==========================================================
  // GENERATE REPORT
  // ==========================================================

//   generateReport(filters: any): Observable<any> {

//     const reportName =
//       filters.report_name ||
//       'Risk Reporting Report';

//     const reportingDate =
//       filters.reporting_date ||
//       '2026-06-30';

//     const country =
//       filters.country ||
//       'CO';

//     const selectedReports =
//       this.mockReports.filter(report =>
//         report.reporting_date === reportingDate &&
//         report.country === country
//       );

//     const getMetric = (name: string): number => {

//       const metric =
//         selectedReports.find(
//           report => report.metric_name === name
//         );

//       return metric
//         ? Number(metric.metric_value)
//         : 0;

//     };


//     const recordsAnalysed =
//       selectedReports[0]?.records_analysed ?? 6;


//     return of({

//       status: 'success',

//       report: {

//         reportName,

//         reportingDate,

//         country,

//         recordsAnalysed,

//         qualityStatus: 'FAILED',

//         qualityScore: 40,

//         failedQualityChecks: 3,

//         totalQualityChecks: 5,

//         filters: {

//           portfolio:
//             filters.portfolio || 'ALL',

//           country,

//           productType:
//             filters.product_type || 'ALL',

//           riskStage:
//             filters.risk_stage || 'ALL',

//           rating:
//             filters.rating || 'ALL',

//           defaultStatus:
//             filters.default_status || 'ALL'

//         },

//         metrics: {

//           exposureCount:
//             getMetric('EXPOSURE_COUNT'),

//           totalExposure:
//             getMetric('TOTAL_EXPOSURE'),

//           totalEad:
//             getMetric('TOTAL_EAD'),

//           averagePd:
//             getMetric('AVERAGE_PD'),

//           averageLgd:
//             getMetric('AVERAGE_LGD'),

//           defaultRate:
//             getMetric('DEFAULT_RATE'),

//           expectedLoss:
//             getMetric('EXPECTED_LOSS')

//         }

//       }

//     });

//   }
private getMockExposureData(): any[] {

  return [

    {
      id: 1,
      reporting_date: '2026-06-30',
      country: 'CO',
      portfolio: 'CORPORATE',
      product_type: 'LOAN',
      risk_stage: 'STAGE_1',
      rating: 'BBB',
      default_flag: false,
      exposure_amount: 250000,
      ead_amount: 230000,
      pd: 0.025,
      lgd: 0.40
    },

    {
      id: 2,
      reporting_date: '2026-06-30',
      country: 'CO',
      portfolio: 'CORPORATE',
      product_type: 'LOAN',
      risk_stage: 'STAGE_2',
      rating: 'BB',
      default_flag: false,
      exposure_amount: 180000,
      ead_amount: 170000,
      pd: 0.08,
      lgd: 0.45
    },

    {
      id: 3,
      reporting_date: '2026-06-30',
      country: 'CO',
      portfolio: 'RETAIL',
      product_type: 'MORTGAGE',
      risk_stage: 'STAGE_1',
      rating: 'A',
      default_flag: false,
      exposure_amount: 320000,
      ead_amount: 300000,
      pd: 0.015,
      lgd: 0.30
    },

    {
      id: 4,
      reporting_date: '2026-06-30',
      country: 'CO',
      portfolio: 'RETAIL',
      product_type: 'CREDIT_CARD',
      risk_stage: 'STAGE_3',
      rating: 'CCC',
      default_flag: true,
      exposure_amount: 50000,
      ead_amount: 45000,
      pd: 1,
      lgd: 0.75
    },

    {
      id: 5,
      reporting_date: '2026-06-30',
      country: 'ES',
      portfolio: 'CORPORATE',
      product_type: 'LOAN',
      risk_stage: 'STAGE_1',
      rating: 'AA',
      default_flag: false,
      exposure_amount: 450000,
      ead_amount: 420000,
      pd: 0.01,
      lgd: 0.35
    }

  ];

}

generateReport(filters: any): Observable<any> {

  const mockData = this.getMockExposureData();

  // ----------------------------------------------------------
  // FILTRAR DATASET
  // ----------------------------------------------------------

  const filtered = mockData.filter((item: any) => {

    if (
      filters.reporting_date &&
      item.reporting_date !== filters.reporting_date
    ) {
      return false;
    }

    if (
      filters.country &&
      item.country !== filters.country
    ) {
      return false;
    }

    if (
      filters.portfolio &&
      item.portfolio !== filters.portfolio
    ) {
      return false;
    }

    if (
      filters.product_type &&
      item.product_type !== filters.product_type
    ) {
      return false;
    }

    if (
      filters.risk_stage &&
      item.risk_stage !== filters.risk_stage
    ) {
      return false;
    }

    if (
      filters.rating &&
      item.rating !== filters.rating
    ) {
      return false;
    }

    if (
      filters.default_status === 'DEFAULT' &&
      item.default_flag !== true
    ) {
      return false;
    }

    if (
      filters.default_status === 'NON_DEFAULT' &&
      item.default_flag !== false
    ) {
      return false;
    }

    return true;

  });


  // ----------------------------------------------------------
  // SIN DATOS
  // ----------------------------------------------------------

  if (filtered.length === 0) {

    return throwError(() => ({
      error: {
        message:
          'No exposure records match the selected filters.'
      }
    }));

  }


  // ----------------------------------------------------------
  // CALCULATE METRICS
  // ----------------------------------------------------------

  const exposureCount =
    filtered.length;


  const totalExposure =
    filtered.reduce(
      (sum: number, item: any) =>
        sum + Number(item.exposure_amount || 0),
      0
    );


  const totalEad =
    filtered.reduce(
      (sum: number, item: any) =>
        sum + Number(item.ead_amount || 0),
      0
    );


  const averagePd =
    filtered.reduce(
      (sum: number, item: any) =>
        sum + Number(item.pd || 0),
      0
    ) / exposureCount;


  const averageLgd =
    filtered.reduce(
      (sum: number, item: any) =>
        sum + Number(item.lgd || 0),
      0
    ) / exposureCount;


  const defaultCount =
    filtered.filter(
      (item: any) =>
        item.default_flag === true
    ).length;


  const defaultRate =
    defaultCount / exposureCount;


  const expectedLoss =
    filtered.reduce(
      (sum: number, item: any) =>
        sum +
        (
          Number(item.ead_amount || 0) *
          Number(item.pd || 0) *
          Number(item.lgd || 0)
        ),
      0
    );


  // ----------------------------------------------------------
  // DATA QUALITY MOCK
  // ----------------------------------------------------------

  const qualityStatus = 'PASSED';

  const totalQualityChecks = 6;

  const failedQualityChecks = 0;

  const qualityScore = 100;


  // ----------------------------------------------------------
  // RESPONSE
  // ----------------------------------------------------------

  const report = {

    reportName:
      filters.report_name,

    reportingDate:
      filters.reporting_date,

    country:
      filters.country,

    recordsAnalysed:
      exposureCount,

    qualityStatus,

    qualityScore,

    failedQualityChecks,

    totalQualityChecks,

    filters: {

      portfolio:
        filters.portfolio || 'ALL',

      country:
        filters.country,

      productType:
        filters.product_type || 'ALL',

      riskStage:
        filters.risk_stage || 'ALL',

      rating:
        filters.rating || 'ALL',

      defaultStatus:
        filters.default_status || 'ALL'

    },

    metrics: {

      exposureCount,

      totalExposure,

      totalEad,

      averagePd,

      averageLgd,

      defaultRate,

      expectedLoss

    }

  };


  return of({

    status: 'success',

    report

  });

}


  // ==========================================================
  // EXPORT FILTERED DATA
  // ==========================================================

  exportFilteredData(filters: any): Observable<Blob> {

    const csv = [
      [
        'id',
        'reporting_date',
        'country',
        'portfolio',
        'product_type',
        'risk_stage',
        'rating',
        'default_flag',
        'exposure_amount',
        'ead_amount',
        'pd',
        'lgd'
      ].join(','),

      [
        1,
        filters.reportingDate || '2026-06-30',
        filters.country || 'CO',
        'CORPORATE',
        'LOAN',
        'STAGE_1',
        'BBB',
        false,
        250000,
        200000,
        0.02,
        0.35
      ].join(','),

      [
        2,
        filters.reportingDate || '2026-06-30',
        filters.country || 'CO',
        'CORPORATE',
        'LOAN',
        'STAGE_2',
        'BBB',
        false,
        300000,
        250000,
        0.04,
        0.40
      ].join(','),

      [
        3,
        filters.reportingDate || '2026-06-30',
        filters.country || 'CO',
        'RETAIL',
        'MORTGAGE',
        'STAGE_2',
        'A',
        false,
        400000,
        320000,
        0.03,
        0.30
      ],

      [
        4,
        filters.reportingDate || '2026-06-30',
        filters.country || 'CO',
        'SME',
        'LOAN',
        'STAGE_3',
        'BB',
        true,
        150000,
        120000,
        0.12,
        0.60
      ]
    ].join('\n');


    const blob =
      new Blob(
        [csv],
        {
          type: 'text/csv;charset=utf-8;'
        }
      );


    return of(blob);

  }

}