import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './auth.guard';

import { LoginComponent } from './login/component/login.component';
import { DashboardComponent } from './dashboard/component/dashboard.component';
import { DocumentationComponent } from './documentation/component/documentation.component';
import { HousekeepingComponent } from './housekeeping/component/housekeeping.component';

import { DataExplorerComponent } from './data-explorer/component/data-explorer.component';
import { UploadDataComponent } from './upload-data/component/upload-data.component';
import { DataQualityComponent } from './data-quality/component/data-quality.component';
import { ReportingComponent } from './audit-reporting/component/audit-reporting.component';


export const appRoutes: Routes = [
 { path: '', redirectTo: 'login', pathMatch: 'full'},
 { path: 'login', component: LoginComponent, canActivate: [guestGuard] },

 // Rutas privadas: requieren un JWT válido
 {
   path: '',
   canActivateChild: [authGuard],
   children: [
     { path: 'dashboard', component: DashboardComponent },
     { path: 'documentation', component: DocumentationComponent },
     { path: 'housekeeping', component: HousekeepingComponent },
     { path: 'data-explorer', component: DataExplorerComponent },
     { path: 'upload-data', component: UploadDataComponent },
     { path: 'data-quality', component: DataQualityComponent },
     { path: 'audit-reporting', component: ReportingComponent }
   ]
 },

 { path: '**', redirectTo: 'login' }
];
