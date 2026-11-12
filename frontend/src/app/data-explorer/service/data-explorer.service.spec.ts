
import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';

import { DataExplorerService } from './data-explorer.service';
import {
  MockDataStoreService,
  MockRiskExposure
} from '../../service/mock-data.service';

import { environment } from '../../../environments/environment';


describe('DataExplorerService', () => {

  let service: DataExplorerService;
  let httpMock: HttpTestingController;
  let mockStore: jasmine.SpyObj<MockDataStoreService>;


  beforeEach(() => {

    mockStore = jasmine.createSpyObj(
      'MockDataStoreService',
      ['getData']
    );

    TestBed.configureTestingModule({

      imports: [
        HttpClientTestingModule
      ],

      providers: [

        DataExplorerService,

        {
          provide: MockDataStoreService,
          useValue: mockStore
        }

      ]

    });

    service = TestBed.inject(DataExplorerService);

    httpMock = TestBed.inject(HttpTestingController);

  });


  afterEach(() => {

    httpMock.verify();

  });


  // ==========================================================
  // TEST 1 — SERVICE CREATION
  // ==========================================================

  it('should be created', () => {

    expect(service).toBeTruthy();

  });


  // ==========================================================
  // TEST 2 — MOCK DATA
  // ==========================================================

  it('should return mock data when mock mode is enabled', () => {

    const originalUseMockData = environment.useMockData;


    Object.defineProperty(
      environment,
      'useMockData',
      {
        value: true,
        writable: true,
        configurable: true
      }
    );


    const mockData: MockRiskExposure[] = [

      {
        id: 1,
        reportingDate: '2025-01-31',
        entityId: 'ENT001',
        entityName: 'Spanish Bank',
        country: 'Spain',
        portfolio: 'Corporate',
        productType: 'Loan',
        exposureAmount: 100000,
        eadAmount: 95000,
        pd: 0.02,
        lgd: 0.45,
        riskStage: 'Stage 1',
        rating: 'A',
        defaultFlag: false,
        defaultDate: null,
        currency: 'EUR',
        dataSource: 'Mock'
      },

      {
        id: 2,
        reportingDate: '2025-01-31',
        entityId: 'ENT002',
        entityName: 'French Bank',
        country: 'France',
        portfolio: 'Corporate',
        productType: 'Loan',
        exposureAmount: 200000,
        eadAmount: 190000,
        pd: 0.03,
        lgd: 0.50,
        riskStage: 'Stage 1',
        rating: 'BBB',
        defaultFlag: false,
        defaultDate: null,
        currency: 'EUR',
        dataSource: 'Mock'
      }

    ];


    mockStore.getData.and.returnValue(mockData);


    service.getDataTable().subscribe(response => {

      expect(response.status)
        .toBe('success');

      expect(response.records)
        .toBe(2);

      expect(response.data)
        .toEqual(mockData);

      expect(mockStore.getData)
        .toHaveBeenCalled();

    });


    /*
     * In mock mode there must NOT be
     * an HTTP request.
     */

    httpMock.expectNone(
      environment.apiUrl +
      'getRiskExposures/'
    );


    Object.defineProperty(
      environment,
      'useMockData',
      {
        value: originalUseMockData,
        writable: true,
        configurable: true
      }
    );

  });


  // ==========================================================
  // TEST 3 — HTTP BACKEND
  // ==========================================================

  it('should request data from the backend when mock mode is disabled', () => {

    const originalUseMockData = environment.useMockData;


    Object.defineProperty(
      environment,
      'useMockData',
      {
        value: false,
        writable: true,
        configurable: true
      }
    );


    const backendData = {

      status: 'success',

      records: 2,

      data: [

        {
          country: 'Spain',
          year: 2025,
          month: 1,
          exposure: 100000
        },

        {
          country: 'France',
          year: 2025,
          month: 1,
          exposure: 200000
        }

      ]

    };


    service.getDataTable().subscribe(response => {

      expect(response)
        .toEqual(backendData);

    });


    const request = httpMock.expectOne(
      environment.apiUrl +
      'getRiskExposures/'
    );


    expect(request.request.method)
      .toBe('GET');


    request.flush(backendData);


    Object.defineProperty(
      environment,
      'useMockData',
      {
        value: originalUseMockData,
        writable: true,
        configurable: true
      }
    );

  });

});

