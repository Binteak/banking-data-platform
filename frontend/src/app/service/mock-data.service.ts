import { Injectable } from '@angular/core';
import { MOCK_INITIAL_DATA } from './mock-initial-data';

export interface MockRiskExposure {

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


@Injectable({
  providedIn: 'root'
})
export class MockDataStoreService {


  private readonly STORAGE_KEY =
    'demo_risk_exposures_v2';


  private data: MockRiskExposure[] = [];


  constructor() {

    this.load();

  }


  // ==========================================================
  // LOAD FROM LOCAL STORAGE
  // ==========================================================

  private load(): void {

  const stored =
    localStorage.getItem(this.STORAGE_KEY);


  if (stored) {

    try {

      this.data =
        JSON.parse(stored);

      return;

    } catch {

      console.warn(
        'Unable to load mock data from localStorage.'
      );

    }

  }


  // Primera ejecución:
  // cargar dataset inicial

  this.data =
    MOCK_INITIAL_DATA.map(record => ({
      ...record
    }));


  this.save();

}

  // ==========================================================
  // GET
  // ==========================================================

  getData(): MockRiskExposure[] {

    return [
      ...this.data
    ];

  }


  // ==========================================================
  // SET / REPLACE DATASET
  // ==========================================================

  setData(
    data: MockRiskExposure[]
  ): void {

    this.data = [
      ...data
    ];

    this.save();

  }


  // ==========================================================
  // ADD RECORDS
  // ==========================================================

  addRecords(
    records: MockRiskExposure[]
  ): MockRiskExposure[] {


    const nextId =
      this.getNextId();


    const recordsWithIds =
      records.map(
        (record, index) => ({

          ...record,

          id:
            nextId + index

        })
      );


    this.data = [

      ...recordsWithIds,

      ...this.data

    ];


    this.save();


    return [
      ...recordsWithIds
    ];

  }


  // ==========================================================
  // DELETE RECORDS
  // ==========================================================

  deleteRecords(
    ids: number[]
  ): number {


    const idSet =
      new Set(ids);


    const originalLength =
      this.data.length;


    this.data =
      this.data.filter(
        record =>
          !idSet.has(record.id)
      );


    this.save();


    return (
      originalLength -
      this.data.length
    );

  }


  // ==========================================================
  // NEXT ID
  // ==========================================================

  private getNextId(): number {


    if (!this.data.length) {

      return 1;

    }


    return (
      Math.max(
        ...this.data.map(
          record =>
            Number(record.id)
        )
      ) + 1
    );

  }


  // ==========================================================
  // SAVE
  // ==========================================================

  private save(): void {

    localStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify(
        this.data
      )
    );

  }


  // ==========================================================
  // CLEAR
  // ==========================================================

  clear(): void {

    this.data = [];

    this.save();

  }

}