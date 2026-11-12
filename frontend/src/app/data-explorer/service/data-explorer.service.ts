import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

import { environment } from '../../../environments/environment';

import {
  MockDataStoreService
} from '../../service/mock-data.service';


@Injectable({
  providedIn: 'root'
})
export class DataExplorerService {

  private apiUrl =
    environment.apiUrl + 'getRiskExposures/';


  constructor(
    private http: HttpClient,
    private mockStore: MockDataStoreService
  ) {}


  // ==========================================================
  // GET DATA
  // ==========================================================

  getDataTable(
    body: any = {}
  ): Observable<any> {


    // ========================================================
    // MOCK MODE - PRODUCTION
    // ========================================================

    if (environment.useMockData) {

      const data =
        this.mockStore.getData();


      return of({

        status: 'success',

        records: data.length,

        data: [...data]

      });

    }


    // ========================================================
    // REAL BACKEND - LOCAL
    // ========================================================

    return this.http.get(
      this.apiUrl
    );

  }

}