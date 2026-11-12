import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ReportingServiceProd } from '../../service/audit-reporting.service.prod';


@Injectable({
  providedIn: 'root'
})
export class ReportingService {

  private apiUrl =
    environment.apiUrl + 'reporting/';


  constructor(
    private http: HttpClient,
    private prodService: ReportingServiceProd
  ) {}


  // ==========================================================
  // REPORTING HISTORY
  // ==========================================================

  getReports(): Observable<any> {

    if (environment.useMockData) {

      return this.prodService.getReports();

    }


    return this.http.get(
      this.apiUrl
    );

  }


  // ==========================================================
  // DYNAMIC FILTERS
  // ==========================================================

  getFilters(
    filters: any
  ): Observable<any> {

    if (environment.useMockData) {

      return this.prodService.getFilters(
        filters
      );

    }


    let params = new HttpParams()
      .set(
        'action',
        'filters'
      );


    Object.keys(filters).forEach(key => {

      const value = filters[key];


      if (
        value !== null &&
        value !== undefined &&
        value !== ''
      ) {

        params = params.set(
          this.toSnakeCase(key),
          value
        );

      }

    });


    return this.http.get(
      this.apiUrl,
      { params }
    );

  }


  // ==========================================================
  // CALCULATE REPORT
  // ==========================================================

  generateReport(
    filters: any
  ): Observable<any> {

    if (environment.useMockData) {

      return this.prodService.generateReport(
        filters
      );

    }


    return this.http.post(
      this.apiUrl,
      filters
    );

  }


  // ==========================================================
  // EXPORT FILTERED EXPOSURES
  // ==========================================================

  exportFilteredData(
    filters: any
  ): Observable<Blob> {

    if (environment.useMockData) {

      return this.prodService.exportFilteredData(
        filters
      );

    }


    let params = new HttpParams()
      .set(
        'action',
        'export'
      );


    Object.keys(filters).forEach(key => {

      const value = filters[key];


      if (
        value !== null &&
        value !== undefined &&
        value !== ''
      ) {

        params = params.set(
          this.toSnakeCase(key),
          value
        );

      }

    });


    return this.http.get(
      this.apiUrl,
      {
        params,
        responseType: 'blob'
      }
    );

  }


  // ==========================================================
  // HELPER
  // ==========================================================

  private toSnakeCase(
    value: string
  ): string {

    return value.replace(
      /[A-Z]/g,
      letter =>
        `_${letter.toLowerCase()}`
    );

  }

}