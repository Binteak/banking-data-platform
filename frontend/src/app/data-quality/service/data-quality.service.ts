import { Injectable } from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable,
  of
} from 'rxjs';

import {
  environment
} from '../../../environments/environment';

import {
  MockDataStoreService
} from '../../service/mock-data.service';


@Injectable({
  providedIn: 'root'
})
export class DataQualityService {


  private apiUrl =
    environment.apiUrl + 'dataQuality/';


  constructor(
    private http: HttpClient,
    private mockStore: MockDataStoreService
  ) {}


  // ==========================================================
  // GET AVAILABLE DATASETS
  // ==========================================================

  getDatasets(): Observable<any> {

    if (environment.useMockData) {

      const data =
        this.mockStore.getData();

      const grouped =
        new Map<string, Set<string>>();


      data.forEach(record => {

        if (!record.country) {
          return;
        }

        if (!grouped.has(record.country)) {

          grouped.set(
            record.country,
            new Set<string>()
          );

        }

        if (record.reportingDate) {

          grouped
            .get(record.country)!
            .add(record.reportingDate);

        }

      });


      const datasets =
        Array.from(grouped.entries())
          .map(([country, dates]) => ({

            country,

            dates:
              Array.from(dates).sort()

          }));


      return of({

        status: 'success',

        datasets

      });

    }


    return this.http.get(
      this.apiUrl
    );

  }


  // ==========================================================
  // RUN DATA QUALITY CHECKS
  // ==========================================================

  runChecks(
    country: string,
    reportingDate: string
  ): Observable<any> {


    // ========================================================
    // MOCK
    // ========================================================

    if (environment.useMockData) {


      const data =
        this.mockStore
          .getData()
          .filter(record =>
            record.country === country &&
            record.reportingDate === reportingDate
          );


      const recordsChecked =
        data.length;


      const executionDate =
        new Date().toISOString();


      // ======================================================
      // CHECK 1 — MISSING ENTITY ID
      // ======================================================

      const missingEntityId =
        data.filter(record =>
          !record.entityId ||
          record.entityId.trim() === ''
        ).length;


      // ======================================================
      // CHECK 2 — INVALID PD
      // ======================================================

      const invalidPd =
        data.filter(record =>
          record.pd === null ||
          record.pd === undefined ||
          record.pd < 0 ||
          record.pd > 1
        ).length;


      // ======================================================
      // CHECK 3 — INVALID LGD
      // ======================================================

      const invalidLgd =
        data.filter(record =>
          record.lgd === null ||
          record.lgd === undefined ||
          record.lgd < 0 ||
          record.lgd > 1
        ).length;


      // ======================================================
      // CHECK 4 — DEFAULT CONSISTENCY
      // ======================================================

      const inconsistentDefaults =
        data.filter(record => {

          if (
            record.defaultFlag === true &&
            !record.defaultDate
          ) {
            return true;
          }


          if (
            record.defaultFlag === false &&
            record.defaultDate
          ) {
            return true;
          }


          return false;

        }).length;


      // ======================================================
      // CHECK 5 — EAD GREATER THAN EXPOSURE
      // ======================================================

      const invalidEad =
        data.filter(record =>
          record.eadAmount >
          record.exposureAmount
        ).length;


      // ======================================================
      // RESULTS
      // ======================================================

      const results = [

        {
          check_name:
            'Missing Entity ID',

          check_description:
            'Validates that every exposure contains a valid entity identifier.',

          status:
            missingEntityId === 0
              ? 'PASSED'
              : 'FAILED',

          records_checked:
            recordsChecked,

          records_failed:
            missingEntityId,

          execution_date:
            executionDate,

          details:
            missingEntityId === 0
              ? 'No missing entity identifiers detected.'
              : `${missingEntityId} missing entity identifiers detected.`
        },


        {
          check_name:
            'Invalid PD',

          check_description:
            'Validates that Probability of Default is between 0 and 1.',

          status:
            invalidPd === 0
              ? 'PASSED'
              : 'FAILED',

          records_checked:
            recordsChecked,

          records_failed:
            invalidPd,

          execution_date:
            executionDate,

          details:
            invalidPd === 0
              ? 'No invalid PD values detected.'
              : `${invalidPd} invalid PD values detected.`
        },


        {
          check_name:
            'Invalid LGD',

          check_description:
            'Validates that Loss Given Default is between 0 and 1.',

          status:
            invalidLgd === 0
              ? 'PASSED'
              : 'FAILED',

          records_checked:
            recordsChecked,

          records_failed:
            invalidLgd,

          execution_date:
            executionDate,

          details:
            invalidLgd === 0
              ? 'No invalid LGD values detected.'
              : `${invalidLgd} invalid LGD values detected.`
        },


        {
          check_name:
            'Default Consistency',

          check_description:
            'Validates consistency between default status and default date.',

          status:
            inconsistentDefaults === 0
              ? 'PASSED'
              : 'FAILED',

          records_checked:
            recordsChecked,

          records_failed:
            inconsistentDefaults,

          execution_date:
            executionDate,

          details:
            inconsistentDefaults === 0
              ? 'Default status and dates are consistent.'
              : `${inconsistentDefaults} inconsistent default records.`
        },


        {
          check_name:
            'EAD Greater Than Exposure',

          check_description:
            'Validates that Exposure at Default does not exceed total exposure.',

          status:
            invalidEad === 0
              ? 'PASSED'
              : 'FAILED',

          records_checked:
            recordsChecked,

          records_failed:
            invalidEad,

          execution_date:
            executionDate,

          details:
            invalidEad === 0
              ? 'All EAD values are within the exposure limit.'
              : `${invalidEad} invalid EAD values detected.`
        }

      ];


      // ======================================================
      // SUMMARY
      // ======================================================

      const checksExecuted =
        results.length;


      const checksPassed =
        results.filter(
          result =>
            result.status === 'PASSED'
        ).length;


      const checksFailed =
        results.filter(
          result =>
            result.status === 'FAILED'
        ).length;


      const qualityScore =
        checksExecuted > 0
          ? (
              checksPassed /
              checksExecuted
            ) * 100
          : 100;


      // ======================================================
      // RESPONSE
      // ======================================================

      return of({

        status:
          'success',

        summary: {

          recordsChecked:
            recordsChecked,

          checksExecuted:
            checksExecuted,

          checksPassed:
            checksPassed,

          checksFailed:
            checksFailed,

          qualityScore:
            Number(
              qualityScore.toFixed(2)
            )

        },

        results

      });

    }


    // ========================================================
    // BACKEND
    // ========================================================

    return this.http.post(

      this.apiUrl,

      {

        country,

        reporting_date:
          reportingDate

      }

    );

  }

}