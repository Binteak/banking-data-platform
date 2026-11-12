// import { Injectable } from '@angular/core';
// import { HttpClient, HttpParams } from '@angular/common/http';
// import { Observable } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })
// export class HousekeepingService {

//   private apiUrl = 'http://127.0.0.1:8001/api';

//   constructor(
//     private http: HttpClient
//   ) {}

//   search(filters: any): Observable<any> {

//     let params = new HttpParams();

//     Object.keys(filters).forEach(key => {

//       const value = filters[key];

//       if (
//         value !== null &&
//         value !== undefined &&
//         value !== ''
//       ) {
//         params = params.set(
//           key,
//           value
//         );
//       }

//     });

//     return this.http.get(
//       `${this.apiUrl}/housekeeping/`,
//       { params }
//     );
//   }


//   deleteRecords(ids: number[]): Observable<any> {

//     return this.http.request(
//       'DELETE',
//       `${this.apiUrl}/housekeeping/`,
//       {
//         body: {
//           ids
//         }
//       }
//     );
//   }

// }


import { Injectable } from '@angular/core';

import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import {
  Observable,
  of
} from 'rxjs';

import { environment } from '../../../environments/environment';

import {
  MockDataStoreService
} from '../../service/mock-data.service';


@Injectable({
  providedIn: 'root'
})
export class HousekeepingService {

  private apiUrl =
    environment.apiUrl + 'housekeeping/';


  constructor(
    private http: HttpClient,
    private mockStore: MockDataStoreService
  ) {}


  // ==========================================================
  // SEARCH
  // ==========================================================

  search(filters: any): Observable<any> {

    // ========================================================
    // MOCK MODE - PRODUCTION
    // ========================================================

    if (environment.useMockData) {

      // ------------------------------------------------------
      // GET DATA FROM MOCK STORE
      // ------------------------------------------------------

      let data =
        this.mockStore.getData();


      // ------------------------------------------------------
      // APPLY FILTERS
      // ------------------------------------------------------

      data = data.filter(record => {

        // Reporting Date
        if (
          filters.reporting_date &&
          record.reportingDate !== filters.reporting_date
        ) {
          return false;
        }


        // Entity ID
        if (
          filters.entity_id &&
          !record.entityId
            ?.toLowerCase()
            .includes(
              filters.entity_id.toLowerCase()
            )
        ) {
          return false;
        }


        // Entity Name
        if (
          filters.entity_name &&
          !record.entityName
            ?.toLowerCase()
            .includes(
              filters.entity_name.toLowerCase()
            )
        ) {
          return false;
        }


        // Country
        if (
          filters.country &&
          record.country !== filters.country
        ) {
          return false;
        }


        // Portfolio
        if (
          filters.portfolio &&
          record.portfolio !== filters.portfolio
        ) {
          return false;
        }


        // Product Type
        if (
          filters.product_type &&
          record.productType !== filters.product_type
        ) {
          return false;
        }


        // Risk Stage
        if (
          filters.risk_stage &&
          record.riskStage !== filters.risk_stage
        ) {
          return false;
        }


        // Rating
        if (
          filters.rating &&
          !record.rating
            ?.toLowerCase()
            .includes(
              filters.rating.toLowerCase()
            )
        ) {
          return false;
        }


        // Default
        if (
          filters.default_flag !== '' &&
          filters.default_flag !== null &&
          filters.default_flag !== undefined
        ) {

          const expected =
            filters.default_flag === 'true';

          if (
            record.defaultFlag !== expected
          ) {
            return false;
          }

        }


        // Data Source
        if (
          filters.data_source &&
          record.dataSource !== filters.data_source
        ) {
          return false;
        }


        return true;

      });


      // ------------------------------------------------------
      // ALL DATA FOR FILTER OPTIONS
      // ------------------------------------------------------

      const allData =
        this.mockStore.getData();


      // ------------------------------------------------------
      // UNIQUE VALUES
      // ------------------------------------------------------

      const unique = (
        values: any[]
      ): string[] => {

        return [
          ...new Set(

            values
              .filter(
                value =>
                  value !== null &&
                  value !== undefined &&
                  value !== ''
              )
              .map(
                value => String(value)
              )

          )
        ].sort();

      };


      // ------------------------------------------------------
      // IMPORTANT
      //
      // MOCK STORE = camelCase
      // COMPONENT   = snake_case
      //
      // We convert here so we DON'T have to touch
      // the HTML or the component.
      // ------------------------------------------------------

      const formattedData =
        data.map(record => ({

          id:
            record.id,

          reporting_date:
            record.reportingDate,

          entity_id:
            record.entityId,

          entity_name:
            record.entityName,

          country:
            record.country,

          portfolio:
            record.portfolio,

          product_type:
            record.productType,

          exposure_amount:
            record.exposureAmount,

          ead_amount:
            record.eadAmount,

          pd:
            record.pd,

          lgd:
            record.lgd,

          risk_stage:
            record.riskStage,

          rating:
            record.rating,

          default_flag:
            record.defaultFlag,

          default_date:
            record.defaultDate,

          currency:
            record.currency,

          data_source:
            record.dataSource

        }));


      // ------------------------------------------------------
      // RETURN SAME STRUCTURE AS BACKEND
      // ------------------------------------------------------

      return of({

        status: 'success',

        records:
          formattedData.length,

        data:
          formattedData,

        filters: {

          reporting_dates:
            unique(
              allData.map(
                record =>
                  record.reportingDate
              )
            ),

          countries:
            unique(
              allData.map(
                record =>
                  record.country
              )
            ),

          portfolios:
            unique(
              allData.map(
                record =>
                  record.portfolio
              )
            ),

          product_types:
            unique(
              allData.map(
                record =>
                  record.productType
              )
            ),

          risk_stages:
            unique(
              allData.map(
                record =>
                  record.riskStage
              )
            ),

          ratings:
            unique(
              allData.map(
                record =>
                  record.rating
              )
            ),

          data_sources:
            unique(
              allData.map(
                record =>
                  record.dataSource
              )
            )

        }

      });

    }


    // ========================================================
    // REAL BACKEND - LOCAL
    // ========================================================

    let params =
      new HttpParams();


    Object.keys(filters).forEach(key => {

      const value =
        filters[key];


      if (
        value !== null &&
        value !== undefined &&
        value !== ''
      ) {

        params =
          params.set(
            key,
            value
          );

      }

    });


    return this.http.get(
      this.apiUrl,
      {
        params
      }
    );

  }


  // ==========================================================
  // DELETE SELECTED
  // ==========================================================

  deleteRecords(
    ids: number[]
  ): Observable<any> {

    // ========================================================
    // MOCK MODE - PRODUCTION
    // ========================================================

    if (environment.useMockData) {

      const deletedRecords =
        this.mockStore.deleteRecords(ids);


      return of({

        status: 'success',

        message:
          'Records deleted successfully.',

        recordsDeleted:
          deletedRecords

      });

    }


    // ========================================================
    // REAL BACKEND - LOCAL
    // ========================================================

    return this.http.request(
      'DELETE',
      this.apiUrl,
      {
        body: {
          ids
        }
      }
    );

  }

}