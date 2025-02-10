import { inject, Injectable } from '@angular/core';
import {
  OptimalControlSuccessResponse,
  PISuccessResponse,
  SimulationSuccessResponse,
} from '@core/types/processing';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { concatMap, map, tap } from 'rxjs';
import { FilesService } from 'src/app/services/files.service';
import { SnackBarService } from 'src/app/services/snack-bar.service';
import { DashboardActions } from 'src/app/state/actions/dashboard.actions';
import { FilesServiceActions } from 'src/app/state/actions/files.service.actions';
import {
  selectCurrentRunData,
  selectCurrentRunName,
  selectCurrentRunValues,
} from 'src/app/state/selectors/runs.selectors';
import { selectCurrentWorkspaceName } from 'src/app/state/selectors/workspace.selectors';

@Injectable()
export class DashboardEffects {
    private readonly store: Store = inject(Store);

    private readonly filesService: FilesService = inject(FilesService);
    private readonly snackBarService: SnackBarService = inject(SnackBarService);

    private readonly actions$: Actions = inject(Actions);

    private readonly addRun$ = createEffect(() =>
        this.actions$.pipe(
            ofType(DashboardActions.addRun),
            concatMap(() =>
                this.filesService
                    .readDataFromFile<
                        | SimulationSuccessResponse
                        | OptimalControlSuccessResponse
                        | PISuccessResponse
                    >('.scr')
                    .pipe(
                        tap((): void =>
                            this.snackBarService.open(
                                'Run imported successfully',
                                'Dismiss',
                                {
                                    panelClass: 'snackbar',
                                    horizontalPosition: 'right',
                                    verticalPosition: 'bottom',
                                    duration: 5000,
                                },
                            ),
                        ),
                        map(
                            (
                                data:
                                    | SimulationSuccessResponse
                                    | OptimalControlSuccessResponse
                                    | PISuccessResponse,
                            ) =>
                                FilesServiceActions.runImportSuccess({
                                    data,
                                    set: true,
                                }),
                        ),
                    ),
            ),
        ),
    );

    private readonly exportRunData$ = createEffect(() =>
        this.actions$.pipe(
            ofType(DashboardActions.exportRunData),
            concatLatestFrom(() => [
                this.store.select(selectCurrentWorkspaceName),
                this.store.select(selectCurrentRunName),
                this.store.select(selectCurrentRunData),
            ]),
            concatMap(([_, workspaceName, runName, runData]) =>
                this.filesService
                    .downloadFileWithData(
                        runData,
                        `${workspaceName}-${runName}.scr`,
                    )
                    .pipe(
                        tap((): void =>
                            this.snackBarService.open(
                                'Run export is ready for downloading',
                                'Dismiss',
                                {
                                    panelClass: 'snackbar',
                                    horizontalPosition: 'right',
                                    verticalPosition: 'bottom',
                                    duration: 5000,
                                },
                            ),
                        ),
                        map(() => FilesServiceActions.runDataExportSuccess()),
                    ),
            ),
        ),
    );

    private readonly exportRunValues$ = createEffect(() =>
        this.actions$.pipe(
            ofType(DashboardActions.exportRunValues),
            concatLatestFrom(() => [
                this.store.select(selectCurrentWorkspaceName),
                this.store.select(selectCurrentRunName),
                this.store.select(selectCurrentRunValues),
            ]),
            concatMap(([_, workspaceName, runName, runValues]) =>
                this.filesService
                    .downloadFileWithData(
                        runValues,
                        `${workspaceName}-${runName}.scs`,
                    )
                    .pipe(
                        tap((): void =>
                            this.snackBarService.open(
                                'Run export is ready for downloading',
                                'Dismiss',
                                {
                                    panelClass: 'snackbar',
                                    horizontalPosition: 'right',
                                    verticalPosition: 'bottom',
                                    duration: 5000,
                                },
                            ),
                        ),
                        map(() => FilesServiceActions.runValuesExportSuccess()),
                    ),
            ),
        ),
    );
}
