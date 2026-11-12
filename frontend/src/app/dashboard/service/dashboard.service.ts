import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})

export class DashboardService {

  constructor(private http: HttpClient) { }
  // apiUrl = 'http://127.0.0.1:8000/api';

  // getHousekeepingExerciseGroup(body: any) {
  //   return this.http.post<any>(
  //     `${this.apiUrl}/getHousekeepingExerciseGroup/`,
  //     body
  //   )
  // }



}