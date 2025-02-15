import { inject, Injectable } from '@angular/core';
import { Constant, Intervention, Model } from '@core/types/model.types';
import {
  OptimalControlSuccessResponse,
  PISuccessResponse,
  ProcessingType,
  SelectedConstant,
  SimulationSuccessResponse,
} from '@core/types/processing';
import { ErrorResponse } from '@core/types/processing/api.types';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { concatMap, map, Observable, switchMap, tap } from 'rxjs';
import { FilesService } from 'src/app/services/files.service';
import { ProcessingService } from 'src/app/services/processing.service';
import { SamplesService } from 'src/app/services/samples.service';
import { SnackBarService } from 'src/app/services/snack-bar.service';
import { AppActions } from 'src/app/state/actions/app.actions';
import { FilesServiceActions } from 'src/app/state/actions/files.service.actions';
import { ProcessingActions } from 'src/app/state/actions/processing.actions';
import { ProcessingServiceActions } from 'src/app/state/actions/processing.service.actions';
import {
  selectCurrentModel,
  selectCurrentWorkspaceName,
} from 'src/app/state/selectors/workspace.selectors';

interface ImportSampleModelProps {
    path: string;
    select: boolean;
}

@Injectable()
export class AppEffects {
    private readonly store: Store = inject(Store);

    private readonly snackBarService: SnackBarService = inject(SnackBarService);
    private readonly filesService: FilesService = inject(FilesService);
    private readonly sampleService: SamplesService = inject(SamplesService);
    private readonly processingService: ProcessingService =
        inject(ProcessingService);

    private readonly actions$: Actions = inject(Actions);

    private readonly importSampleModel$ = createEffect(() =>
        this.actions$.pipe(
            ofType(AppActions.importSampleModel),
            concatMap(({ path, select }: ImportSampleModelProps) =>
                this.sampleService.getSample<Model>(path).pipe(
                    map((model: Model) =>
                        FilesServiceActions.sampleModelImportSuccess({
                            model,
                            select,
                        }),
                    ),
                ),
            ),
        ),
    );

    private readonly importModel$ = createEffect(() =>
        this.actions$.pipe(
            ofType(AppActions.importModel),
            concatMap(() =>
                this.filesService.readDataFromFile<Model>(`.scm`).pipe(
                    tap((): void => {
                        this.snackBarService.open(
                            'Model imported successfully',
                            'Dismiss',
                            {
                                panelClass: 'snackbar',
                                horizontalPosition: 'right',
                                verticalPosition: 'bottom',
                                duration: 5000,
                            },
                        );
                    }),
                    map((model: Model) =>
                        FilesServiceActions.modelImportSuccess({
                            model,
                        }),
                    ),
                ),
            ),
        ),
    );

    private readonly exportModel$ = createEffect(() =>
        this.actions$.pipe(
            ofType(AppActions.exportModel),
            concatLatestFrom(() => [
                this.store.select(selectCurrentModel),
                this.store.select(selectCurrentWorkspaceName),
            ]),
            concatMap(([_, model, name]) =>
                this.filesService
                    .downloadFileWithData(model, `${name}.scm`)
                    .pipe(
                        tap((): void => {
                            this.snackBarService.open(
                                'Model export is ready for downloading',
                                'Dismiss',
                                {
                                    panelClass: 'snackbar',
                                    horizontalPosition: 'right',
                                    verticalPosition: 'bottom',
                                    duration: 5000,
                                },
                            );
                        }),
                        map(() => FilesServiceActions.modelExportSuccess()),
                    ),
            ),
        ),
    );

    private readonly processModel$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(ProcessingActions.processModel),
                concatLatestFrom(
                    (): Observable<Model> =>
                        this.store.select(selectCurrentModel),
                ),
                switchMap(([{ parameters, mode }, model]) => {
                    switch (mode) {
                        case ProcessingType.Simulation:
                            return this.processingService.simulateModel({
                                parameters,
                                model: {
                                    ...model,
                                    constants: [
                                        ...model.constants,
                                        ...model.interventions.map(
                                            (
                                                intervention: Intervention,
                                            ): Constant => ({
                                                id: intervention.id,
                                                name: intervention.name,
                                                value: 0,
                                            }),
                                        ),
                                    ],
                                    interventions: [],
                                },
                            });

                        case ProcessingType.OptimalControl:
                            return this.processingService.optimizeModel({
                                parameters,
                                model,
                            });

                        case ProcessingType.PI:
                            return this.processingService.identifyParameters({
                                parameters,
                                model: {
                                    ...model,
                                    constants: model.constants.filter(
                                        (constant: Constant): boolean =>
                                            !parameters.selectedConstants.find(
                                                (
                                                    selectedConstant: SelectedConstant,
                                                ): boolean =>
                                                    selectedConstant.id ===
                                                    constant.id,
                                            ),
                                    ),
                                    interventions: [
                                        ...model.interventions,
                                        ...parameters.selectedConstants.map(
                                            (
                                                selectedConstant: SelectedConstant,
                                            ): Intervention => ({
                                                id: selectedConstant.id,
                                                name: selectedConstant.name,
                                            }),
                                        ),
                                    ],
                                },
                            });

                        default: {
                            throw new Error('Unknown processing mode');
                        }
                    }
                }),
                tap(
                    (
                        response:
                            | SimulationSuccessResponse
                            | OptimalControlSuccessResponse
                            | PISuccessResponse
                            | ErrorResponse,
                    ): void => {
                        if (!('error' in response)) {
                            this.snackBarService.open(
                                'Processing completed successfully',
                                'Dismiss',
                                {
                                    panelClass: 'snackbar',
                                    horizontalPosition: 'right',
                                    verticalPosition: 'bottom',
                                    duration: 5000,
                                },
                            );

                            this.store.dispatch(
                                ProcessingServiceActions.modelProcessingSuccess(
                                    {
                                        data: response,
                                        set: false,
                                    },
                                ),
                            );

                            return;
                        }

                        this.snackBarService.open(
                            'Processing failed.\n\n' +
                                `Error: ${response.error}`,
                            'Dismiss',
                            {
                                panelClass: 'snackbar',
                                horizontalPosition: 'right',
                                verticalPosition: 'bottom',
                            },
                        );
                    },
                ),
            ),
        {
            dispatch: false,
        },
    );
}
