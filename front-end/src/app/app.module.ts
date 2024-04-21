import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatOptionModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';

import { PlotlyModule } from 'angular-plotly.js';
import PlotlyJS from 'plotly.js-dist-min';

import { AppComponent } from './app.component';
import { CompartmentCreationDialogComponent } from './components/compartment-creation-dialog/compartment-creation-dialog.component';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { DatatableComponent } from './components/datatable/datatable.component';
import { DefinitionsTableDialogComponent } from './components/definitions-table-dialog/definitions-table-dialog.component';
import { EquationInputComponent } from './components/equation-input/equation-input.component';
import { FlowCreationDialogComponent } from './components/flow-creation-dialog/flow-creation-dialog.component';
import { OptimalControlParametersInputPanelComponent } from './components/optimal-control-parameters-input-panel/optimal-control-parameters-input-panel.component';
import { ParametersIdentificationParametersInputPanelComponent } from './components/parameters-identification-parameters-input-panel/parameters-identification-parameters-input-panel.component';
import { ProcessingDialogComponent } from './components/processing-dialog/processing-dialog.component';
import { SimulationParametersInputPanelComponent } from './components/simulation-parameters-input-panel/simulation-parameters-input-panel.component';

PlotlyModule.plotlyjs = PlotlyJS;

@NgModule({
    declarations: [
        AppComponent,
        CompartmentCreationDialogComponent,
        ConfirmationDialogComponent,
        ProcessingDialogComponent,
        SimulationParametersInputPanelComponent,
        OptimalControlParametersInputPanelComponent,
        ParametersIdentificationParametersInputPanelComponent,
        FlowCreationDialogComponent,
        DashboardComponent,
        DefinitionsTableDialogComponent,
        EquationInputComponent,
        DatatableComponent,
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        MatIconModule,
        MatButtonModule,
        MatDialogModule,
        MatInputModule,
        ReactiveFormsModule,
        HttpClientModule,
        PlotlyModule,
        MatTableModule,
        MatSelectModule,
        MatOptionModule,
        MatChipsModule,
        MatSlideToggleModule,
        MatSnackBarModule,
        MatButtonToggleModule,
        MatTabsModule,
        MatAutocompleteModule,
    ],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
