// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })
// export class UploadDataService {

//   private apiUrl = 'http://127.0.0.1:8001/api';

//   constructor(private http: HttpClient) {}

//   uploadData(file: File): Observable<any> {

//     const formData = new FormData();

//     formData.append('file', file);

//     return this.http.post(
//       `${this.apiUrl}/uploadData/`,
//       formData
//     );
//   }
// }


import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import {
  MockDataStoreService,
  MockRiskExposure
} from '../../service/mock-data.service';


@Injectable({
  providedIn: 'root'
})
export class UploadDataService {

  private apiUrl =
    environment.apiUrl + 'uploadData/';


  constructor(
    private http: HttpClient,
    private mockStore: MockDataStoreService
  ) {}


  // ==========================================================
  // UPLOAD DATA
  // ==========================================================

  uploadData(
    file: File
  ): Observable<any> {


    // ========================================================
    // MOCK MODE - PRODUCTION
    // ========================================================

    if (environment.useMockData) {

      return new Observable(observer => {

        const reader =
          new FileReader();


        reader.onload = () => {

          try {

            const csv =
              reader.result as string;


            const records =
              this.parseCSV(csv);


            if (!records.length) {

              observer.error({
                error: {
                  message:
                    'The uploaded CSV does not contain any records.'
                }
              });

              return;

            }


            // Añadir al dataset común

            const addedRecords =
              this.mockStore.addRecords(
                records
              );


            observer.next({

              status: 'success',

              message:
                'File uploaded successfully.',

              records:
                addedRecords.length,

              data:
                addedRecords

            });


            observer.complete();

          } catch (error) {

            console.error(
              'Error processing mock CSV:',
              error
            );


            observer.error({
              error: {
                message:
                  'Unable to process the CSV file.'
              }
            });

          }

        };


        reader.onerror = () => {

          observer.error({
            error: {
              message:
                'Unable to read the uploaded file.'
            }
          });

        };


        reader.readAsText(file);

      });

    }


    // ========================================================
    // REAL BACKEND - LOCAL
    // ========================================================

    const formData =
      new FormData();


    formData.append(
      'file',
      file
    );


    return this.http.post(
      this.apiUrl,
      formData
    );

  }


  // ==========================================================
  // CSV PARSER
  // ==========================================================

  private parseCSV(
    csv: string
  ): MockRiskExposure[] {


    const lines =
      csv
        .trim()
        .split(/\r?\n/);


    if (lines.length < 2) {

      return [];

    }


    // --------------------------------------------------------
    // HEADERS
    // --------------------------------------------------------

    const headers =
      lines[0]
        .split(',')
        .map(header =>
          header.trim()
        );


    const records:
      MockRiskExposure[] = [];


    // --------------------------------------------------------
    // ROWS
    // --------------------------------------------------------

    for (
      let i = 1;
      i < lines.length;
      i++
    ) {

      const line =
        lines[i].trim();


      if (!line) {

        continue;

      }


      const values =
        line.split(',');


      const row:
        any = {};


      headers.forEach(
        (header, index) => {

          row[header] =
            values[index]
              ?.trim() ?? '';

        }
      );


      // ------------------------------------------------------
      // CONVERT CSV ROW
      // ------------------------------------------------------

      records.push({

        id: 0,

        reportingDate:
          row.reporting_date,

        entityId:
          row.entity_id,

        entityName:
          row.entity_name,

        country:
          row.country,

        portfolio:
          row.portfolio,

        productType:
          row.product_type,

        exposureAmount:
          Number(
            row.exposure_amount
          ),

        eadAmount:
          Number(
            row.ead_amount
          ),

        pd:
          Number(
            row.pd
          ),

        lgd:
          Number(
            row.lgd
          ),

        riskStage:
          row.risk_stage,

        rating:
          row.rating,

        defaultFlag:
          row.default_flag === 'true',

        defaultDate:
          row.default_date || null,

        currency:
          row.currency,

        dataSource:
          row.data_source

      });

    }


    return records;

  }

}