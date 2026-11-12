import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { FileUploadModule } from 'primeng/fileupload';

import { UploadDataService } from '../service/upload-data.service';

import { TranslatePipe } from '../../i18n/translate.pipe';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../login/service/auth.service';


// Archivos de demostración (src/assets/demo-data): se pueden usar
// directamente en el selector o descargar para ver su contenido.
type DemoFileStatus = 'valid' | 'quality' | 'rejected';

interface DemoFile {
  file: string;
  folder: 'valid' | 'invalid';
  country: string;
  period: string;
  rows: number;
  status: DemoFileStatus;
  note: string;
  initial?: boolean;
}


const CLEAN_NOTE = 'Clean data: every quality check passes.';
const QUALITY_NOTE_A = 'Loads, but Data Quality fails: PD > 1, LGD < 0, EAD > exposure and a default without date.';
const QUALITY_NOTE_B = 'Loads, but Data Quality fails: PD < 0, LGD > 1, EAD > exposure and a default without date.';


const DEMO_FILES: DemoFile[] = [
  { file: 'maestro_PE_09_2022.csv', folder: 'valid', country: 'PE', period: '09/2022', rows: 5, status: 'valid', note: CLEAN_NOTE, initial: true },
  { file: 'maestro_ES_03_2026.csv', folder: 'valid', country: 'ES', period: '03/2026', rows: 5, status: 'valid', note: CLEAN_NOTE, initial: true },
  { file: 'maestro_ES_06_2026.csv', folder: 'valid', country: 'ES', period: '06/2026', rows: 5, status: 'valid', note: CLEAN_NOTE },
  { file: 'maestro_CO_03_2025.csv', folder: 'valid', country: 'CO', period: '03/2025', rows: 10, status: 'valid', note: CLEAN_NOTE },
  { file: 'maestro_ES_03_2026_ERROR.csv', folder: 'invalid', country: 'ES', period: '03/2026', rows: 5, status: 'quality', note: QUALITY_NOTE_A },
  { file: 'maestro_ES_06_2026_ERROR.csv', folder: 'invalid', country: 'ES', period: '06/2026', rows: 5, status: 'quality', note: QUALITY_NOTE_B },
  { file: 'maestro_PE_09_2022_ERROR.csv', folder: 'invalid', country: 'PE', period: '09/2022', rows: 5, status: 'quality', note: QUALITY_NOTE_A },
  { file: 'maestro_CO_03_2025_ERROR.csv', folder: 'invalid', country: 'CO', period: '03/2025', rows: 10, status: 'rejected', note: 'Rejected: row 5 has no entity_id, so nothing is stored (all-or-nothing upload).' }
];
@Component({
  standalone: true,
  selector: 'app-upload-data',

  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    DividerModule,
    TableModule,
    FileUploadModule,
    TranslatePipe
  ],

  templateUrl: './upload-data.component.html',
  styleUrls: ['./upload-data.component.css']
})
export class UploadDataComponent {

  // ==========================================================
  // FILE
  // ==========================================================

  selectedFile: File | null = null;

  uploadedFileName = '';

  uploading = false;

  isDragging = false;


  // ==========================================================
  // RESULT
  // ==========================================================

  uploadSuccess = false;

  uploadError = false;

  successMessage = '';

  errorMessage = '';


  // ==========================================================
  // ARCHIVOS DE DEMOSTRACIÓN
  // ==========================================================

  readonly demoGroups = [
    {
      title: 'Valid files',
      icon: 'pi pi-check-circle',
      files: DEMO_FILES.filter(f => f.folder === 'valid')
    },
    {
      title: 'Files with errors',
      icon: 'pi pi-exclamation-triangle',
      files: DEMO_FILES.filter(f => f.folder === 'invalid')
    }
  ];

  readonly statusLabels: Record<DemoFileStatus, string> = {
    valid: 'Valid',
    quality: 'Quality errors',
    rejected: 'Rejected'
  };

  readonly countryNames: Record<string, string> = {
    ES: 'Spain',
    PE: 'Peru',
    CO: 'Colombia'
  };

  // Con datos simulados en el navegador no existe el estado inicial del backend
  readonly usesBackend = !environment.useMockData;

  // Archivo de demo que se está descargando para usarlo
  loadingDemo = '';

  recordsProcessed = 0;


  // ==========================================================
  // PREVIEW
  // ==========================================================

  previewData: any[] = [];

  previewColumns: string[] = [];


  // ==========================================================
  // CONSTRUCTOR
  // ==========================================================

  // Rol Analyst: solo lectura (el backend devuelve 403 igualmente)
  get canWrite(): boolean {
    return this.auth.isDataAdmin();
  }

  constructor(
    private api: UploadDataService,
    private auth: AuthService
  ) {}


  // ==========================================================
  // FILE SELECTED FROM PRIME NG
  // ==========================================================

  onFileSelected(event: any): void {

    const file: File | undefined = event?.files?.[0];

    if (!file) {
      return;
    }

    this.handleSelectedFile(file);
  }


  // ==========================================================
  // DRAG OVER
  // ==========================================================

  onDragOverFile(event: DragEvent): void {

    event.preventDefault();
    event.stopPropagation();

    this.isDragging = true;
  }


  // ==========================================================
  // DRAG LEAVE
  // ==========================================================

  onDragLeaveFile(event: DragEvent): void {

    event.preventDefault();
    event.stopPropagation();

    this.isDragging = false;
  }


  // ==========================================================
  // DROP FILE
  // ==========================================================

  onDropFile(event: DragEvent): void {

    event.preventDefault();
    event.stopPropagation();

    this.isDragging = false;

    const file = event.dataTransfer?.files?.[0];

    if (!file) {
      return;
    }

    this.handleSelectedFile(file);
  }


  // ==========================================================
  // DEMO FILES
  // ==========================================================

  demoUrl(demo: DemoFile): string {

    return `assets/demo-data/${demo.folder}/${demo.file}`;

  }


  // Carga el CSV de demo en el selector, como si se hubiera elegido a mano
  async useDemoFile(demo: DemoFile): Promise<void> {

    this.loadingDemo = demo.file;

    try {

      const response = await fetch(this.demoUrl(demo));

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();

      this.handleSelectedFile(
        new File([blob], demo.file, { type: 'text/csv' })
      );

      // Lleva la vista al archivo seleccionado (y a sus botones)
      setTimeout(() =>
        document
          .querySelector('.selected-file')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      );

    } catch {

      this.uploadError = true;
      this.errorMessage = 'The demo file could not be loaded.';

    } finally {

      this.loadingDemo = '';

    }

  }


  // ==========================================================
  // HANDLE SELECTED FILE
  // ==========================================================

  private handleSelectedFile(file: File): void {

    const fileName = file.name.toLowerCase();

    const validFile =
      fileName.endsWith('.csv') ||
      fileName.endsWith('.xlsx');

    // --------------------------------------------------------
    // INVALID FILE
    // --------------------------------------------------------

    if (!validFile) {

      this.selectedFile = null;

      this.uploadedFileName = '';

      this.uploadError = true;

      this.errorMessage =
        'Please select a CSV or Excel file.';

      return;
    }


    // --------------------------------------------------------
    // STORE FILE
    // --------------------------------------------------------

    this.selectedFile = file;

    this.uploadedFileName = file.name;

    this.uploadSuccess = false;

    this.uploadError = false;

    this.successMessage = '';

    this.errorMessage = '';

    this.recordsProcessed = 0;

    this.previewData = [];

    this.previewColumns = [];


    // --------------------------------------------------------
    // CSV PREVIEW
    // --------------------------------------------------------

    if (fileName.endsWith('.csv')) {

      this.readCSVPreview(file);

    }

  }


  // ==========================================================
  // CSV PREVIEW
  // ==========================================================

  readCSVPreview(file: File): void {

    const reader = new FileReader();

    reader.onload = (event: any) => {

      const text = event.target.result;

      const lines = text
        .split(/\r?\n/)
        .filter(
          (line: string) =>
            line.trim() !== ''
        );


      if (lines.length === 0) {

        this.previewData = [];

        this.previewColumns = [];

        return;
      }


      // ------------------------------------------------------
      // HEADERS
      // ------------------------------------------------------

      this.previewColumns =
        this.parseCSVLine(lines[0]);


      // ------------------------------------------------------
      // DATA
      // ------------------------------------------------------

      this.previewData = lines
        .slice(1)
        .map((line: string) => {

          const values =
            this.parseCSVLine(line);

          const row: any = {};


          this.previewColumns.forEach(
            (
              column: string,
              index: number
            ) => {

              row[column] =
                values[index] ?? '';

            }
          );


          return row;

        });

    };


    reader.onerror = () => {

      this.uploadError = true;

      this.errorMessage =
        'Unable to read the selected CSV file.';

    };


    reader.readAsText(file);

  }


  // ==========================================================
  // CSV PARSER
  // ==========================================================

  parseCSVLine(line: string): string[] {

    const result: string[] = [];

    let current = '';

    let insideQuotes = false;


    for (
      let i = 0;
      i < line.length;
      i++
    ) {

      const char = line[i];


      if (char === '"') {

        insideQuotes = !insideQuotes;

      }

      else if (
        char === ',' &&
        !insideQuotes
      ) {

        result.push(
          current.trim()
        );

        current = '';

      }

      else {

        current += char;

      }

    }


    result.push(
      current.trim()
    );


    return result;

  }


  // ==========================================================
  // PROCESS FILE
  // ==========================================================

  processFile(): void {

    console.log(
      'PROCESS FILE CLICKED'
    );

    console.log(
      'Selected file:',
      this.selectedFile
    );


    // --------------------------------------------------------
    // NO FILE
    // --------------------------------------------------------

    if (!this.selectedFile) {

      this.uploadError = true;

      this.errorMessage =
        'Please select a file first.';

      return;
    }


    // --------------------------------------------------------
    // START UPLOAD
    // --------------------------------------------------------

    this.uploading = true;

    this.uploadSuccess = false;

    this.uploadError = false;

    this.successMessage = '';

    this.errorMessage = '';


    // --------------------------------------------------------
    // SEND FILE TO BACKEND
    // --------------------------------------------------------

    this.api
      .uploadData(this.selectedFile)
      .subscribe({

        next: (response: any) => {

          console.log(
            'Upload response:',
            response
          );


          if (
            response?.status === 'success'
          ) {

            this.uploadSuccess = true;

            this.successMessage =
              response.message ??
              'File processed successfully.';

            this.recordsProcessed =
              response.recordsProcessed ??
              0;

          }

          else {

            this.uploadError = true;

            this.errorMessage =
              response?.message ??
              'The file could not be processed.';

          }


          this.uploading = false;

        },


        error: (error: any) => {

          console.error(
            'Upload error:',
            error
          );


          this.uploadError = true;

          this.errorMessage =
            error?.error?.message ??
            'Error uploading the file.';


          this.uploading = false;

        }

      });

  }


  // ==========================================================
  // CLEAR
  // ==========================================================

  clear(): void {

    this.selectedFile = null;

    this.uploadedFileName = '';

    this.previewData = [];

    this.previewColumns = [];

    this.uploadSuccess = false;

    this.uploadError = false;

    this.successMessage = '';

    this.errorMessage = '';

    this.recordsProcessed = 0;

    this.uploading = false;

    this.isDragging = false;

  }

}