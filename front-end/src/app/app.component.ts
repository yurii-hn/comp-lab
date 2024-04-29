import {
    AfterViewInit,
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ICompartmentDefinition } from '@core/types/definitions';
import {
    ICompartment,
    ICompartmentBase,
    IConstant,
    IEditCompartmentPayload,
    IIntervention,
} from '@core/types/model';
import {
    IOptimalControlResponseData,
    IPIResponseData,
    IPISelectedConstant,
    IProcessingDialogValue,
    ISimulationResponseData,
    isProcessingDialogOptimalControlValue,
    isProcessingDialogPIValue,
    isProcessingDialogSimulationValue,
} from '@core/types/processing';
import { IResultsBody } from '@core/types/results';
import { IExportModel, IImportModel, IWorkspace } from '@core/types/workspaces';
import { EdgeSingular, NodeSingular, SingularElementArgument } from 'cytoscape';
import {
    Observable,
    Subscription,
    debounceTime,
    filter,
    map,
    take,
    tap,
} from 'rxjs';
import { CompartmentCreationDialogComponent } from './components/compartment-creation-dialog/compartment-creation-dialog.component';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { DefinitionsTableDialogComponent } from './components/definitions-table-dialog/definitions-table-dialog.component';
import { FlowCreationDialogComponent } from './components/flow-creation-dialog/flow-creation-dialog.component';
import { ProcessingDialogComponent } from './components/processing-dialog/processing-dialog.component';
import { fromResizeObserver } from './core/utils';
import { FilesService } from './services/files.service';
import { ModelService } from './services/model.service';
import { ProcessingService } from './services/processing.service';
import { ResultsStorageService } from './services/results-storage.service';
import { WorkspacesService } from './services/workspaces.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
    public readonly workspaceControl: FormControl = new FormControl();

    public get elementSelected(): boolean {
        return !!this.modelService.selectedElement;
    }

    public get compartmentsCount(): number {
        return this.modelService.compartmentsCount;
    }

    @ViewChild('canvas') private readonly canvas!: ElementRef<HTMLElement>;

    private readonly windowResize$: Observable<ResizeObserverEntry> =
        fromResizeObserver(window.document.body);
    private readonly subscriptions: Subscription = new Subscription();

    constructor(
        public readonly workspacesService: WorkspacesService,
        public readonly resultsStorageService: ResultsStorageService,
        private readonly dialogService: MatDialog,
        private readonly processingService: ProcessingService,
        private readonly modelService: ModelService,
        private readonly filesService: FilesService,
        private readonly snackBar: MatSnackBar
    ) {}

    public ngOnInit(): void {
        const workspaceInitSub: Subscription =
            this.workspacesService.currentWorkspace$
                .pipe(
                    take(2),
                    tap((workspace: IWorkspace): void => {
                        this.workspaceControl.setValue(workspace.name, {
                            emitEvent: false,
                        });
                    })
                )
                .subscribe();

        const workspaceChangeSub: Subscription =
            this.workspaceControl.valueChanges
                .pipe(
                    tap((workspaceName: string): void => {
                        this.modelService.changeWorkspace(workspaceName);
                    })
                )
                .subscribe();

        this.initWorkspace();

        const windowResizeSub: Subscription = this.windowResize$
            .pipe(debounceTime(500), tap(this.onWindowResize.bind(this)))
            .subscribe();

        this.subscriptions.add(workspaceInitSub);
        this.subscriptions.add(workspaceChangeSub);
        this.subscriptions.add(windowResizeSub);
    }

    public ngAfterViewInit(): void {
        this.modelService.initCytoscape(this.canvas.nativeElement);

        const compartmentOpeningSub: Subscription =
            this.modelService.compartmentOpen
                .pipe(
                    tap((): void => {
                        this.openEditCompartmentDialog();
                    })
                )
                .subscribe();

        const fromOpeningSub: Subscription = this.modelService.fromOpen
            .pipe(
                tap((): void => {
                    this.openEditFlowDialog();
                })
            )
            .subscribe();

        const flowAddSub: Subscription = this.modelService.flowAdd
            .pipe(
                tap((addedEdge: EdgeSingular): void => {
                    this.onFlowCreationDialog(addedEdge);
                })
            )
            .subscribe();

        this.subscriptions.add(compartmentOpeningSub);
        this.subscriptions.add(fromOpeningSub);
        this.subscriptions.add(flowAddSub);
    }

    public ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    public addNewWorkspace(): void {
        this.modelService.addNewWorkspace();
    }

    public removeCurrentWorkspace(): void {
        this.modelService.removeCurrentWorkspace();
    }

    public openDefinitionsTableDialog(): void {
        const definitionsTableDialog: MatDialogRef<DefinitionsTableDialogComponent> =
            this.dialogService.open(DefinitionsTableDialogComponent, {
                autoFocus: false,
                maxWidth: '95vw',
                maxHeight: '95vh',
                height: '95vh',
            });
    }

    public openAddCompartmentDialog(): void {
        const creationDialog: MatDialogRef<CompartmentCreationDialogComponent> =
            this.dialogService.open(CompartmentCreationDialogComponent, {
                autoFocus: false,
            });

        this.subscriptions.add(
            creationDialog
                .afterClosed()
                .pipe(
                    filter((compartment: ICompartmentBase) =>
                        Boolean(compartment)
                    ),
                    tap(this.addCompartment.bind(this))
                )
                .subscribe()
        );
    }

    public layout(): void {
        this.modelService.layout();
    }

    public onDeleteElementDialog(): void {
        const selectedElement: SingularElementArgument =
            this.modelService.selectedElement;

        const isCompartment: boolean = selectedElement.group() === 'nodes';

        const deletionSubject: string = isCompartment ? 'compartment' : 'flow';

        const deletionDialog: MatDialogRef<ConfirmationDialogComponent> =
            this.dialogService.open(ConfirmationDialogComponent, {
                data: {
                    title: `Delete ${deletionSubject}`,
                    message: `Are you sure you want to delete the selected ${deletionSubject}?`,
                },
                autoFocus: false,
            });

        this.subscriptions.add(
            deletionDialog
                .afterClosed()
                .pipe(
                    filter((confirmed: boolean): boolean => confirmed),
                    tap((): void => {
                        if (isCompartment) {
                            this.modelService.removeCompartment();

                            return;
                        }

                        this.modelService.removeFlow();
                    })
                )
                .subscribe()
        );
    }

    public onClearCompartmentsDialog(): void {
        const clearingDialog: MatDialogRef<ConfirmationDialogComponent> =
            this.dialogService.open(ConfirmationDialogComponent, {
                data: {
                    title: 'Clear model',
                    message:
                        'Are you sure you want to delete whole model?' +
                        '\n\nAll constants will remain intact',
                },
                autoFocus: false,
            });

        this.subscriptions.add(
            clearingDialog
                .afterClosed()
                .pipe(
                    filter((confirmed: boolean) => confirmed),
                    tap((): void => {
                        this.modelService.clear();
                    })
                )
                .subscribe()
        );
    }

    public onModelImport(): void {
        this.filesService
            .readDataFromFile<IImportModel>('.scm')
            .pipe(
                tap((model: IImportModel) => {
                    this.modelService.parseSample(model);

                    this.layout();

                    this.snackBar.open(
                        'Model imported successfully',
                        'Dismiss',
                        {
                            panelClass: 'snackbar',
                            horizontalPosition: 'right',
                            verticalPosition: 'bottom',
                        }
                    );
                })
            )
            .subscribe();
    }

    public onModelExport(): void {
        const model: IExportModel = this.modelService.getModelExport();

        this.filesService.downloadFileWithData(
            model,
            `${this.workspacesService.currentWorkspace.name}.scm`
        );

        this.snackBar.open('Model export is ready for downloading', 'Dismiss', {
            panelClass: 'snackbar',
            horizontalPosition: 'right',
            verticalPosition: 'bottom',
        });
    }

    public onDashboardDialog(): void {
        const simulationResultsDialog: MatDialogRef<DashboardComponent> =
            this.dialogService.open(DashboardComponent, {
                autoFocus: false,
                height: '95vh',
                width: '95vw',
            });
    }

    public onProcessModelDialog(): void {
        const simulationDialog: MatDialogRef<ProcessingDialogComponent> =
            this.dialogService.open(ProcessingDialogComponent, {
                autoFocus: false,
            });

        this.subscriptions.add(
            simulationDialog
                .afterClosed()
                .pipe(
                    filter(
                        (
                            output: IProcessingDialogValue
                        ): output is NonNullable<IProcessingDialogValue> =>
                            Boolean(output)
                    ),
                    tap(this.processModel.bind(this))
                )
                .subscribe()
        );
    }

    private openEditCompartmentDialog(): void {
        const selectedCompartment: NodeSingular = this.modelService
            .selectedElement as NodeSingular;

        const compartmentValue: number = this.modelService
            .getDefinitionsTable()
            .compartments.find(
                (compartment: ICompartmentDefinition) =>
                    compartment.name === selectedCompartment.data('name')
            )!.value;

        const editDialog: MatDialogRef<CompartmentCreationDialogComponent> =
            this.dialogService.open(CompartmentCreationDialogComponent, {
                autoFocus: false,
                data: {
                    name: selectedCompartment.data('name'),
                    value: compartmentValue,
                },
            });

        this.subscriptions.add(
            editDialog
                .afterClosed()
                .pipe(
                    filter((compartment: ICompartmentBase) =>
                        Boolean(compartment)
                    ),
                    map(
                        (
                            compartment: ICompartmentBase
                        ): IEditCompartmentPayload => ({
                            ...compartment,
                            previousName: selectedCompartment.data('name'),
                        })
                    ),
                    tap(this.editCompartment.bind(this))
                )
                .subscribe()
        );
    }

    private onFlowCreationDialog(addedEdge: EdgeSingular): void {
        const creationDialog: MatDialogRef<FlowCreationDialogComponent> =
            this.dialogService.open(FlowCreationDialogComponent, {
                autoFocus: false,
            });

        this.subscriptions.add(
            creationDialog
                .afterClosed()
                .pipe(
                    tap((flowEquation: string) => {
                        if (!flowEquation) {
                            addedEdge.remove();
                        }
                    }),
                    filter((flowEquation: string) => Boolean(flowEquation)),
                    tap((flowEquation: string): void => {
                        addedEdge.select();

                        this.modelService.editFlow(flowEquation);
                    })
                )
                .subscribe()
        );
    }

    private openEditFlowDialog(): void {
        const selectedFlow: EdgeSingular = this.modelService
            .selectedElement as EdgeSingular;

        const editDialog: MatDialogRef<FlowCreationDialogComponent> =
            this.dialogService.open(FlowCreationDialogComponent, {
                autoFocus: false,
                data: selectedFlow.data('equation'),
            });

        this.subscriptions.add(
            editDialog
                .afterClosed()
                .pipe(
                    filter((flowEquation: string) => Boolean(flowEquation)),
                    tap((flowEquation: string) => {
                        this.modelService.editFlow(flowEquation);
                    })
                )
                .subscribe()
        );
    }

    private addCompartment(compartmentData: ICompartmentBase): void {
        this.modelService.addCompartment(compartmentData);
    }

    private editCompartment(compartmentData: IEditCompartmentPayload): void {
        this.modelService.editCompartment(compartmentData);
    }

    private processModel(
        dialogOutput: NonNullable<IProcessingDialogValue>
    ): void {
        let observable: Observable<
            | ISimulationResponseData
            | IOptimalControlResponseData
            | IPIResponseData
        >;

        if (isProcessingDialogSimulationValue(dialogOutput)) {
            observable = this.processingService.simulateModel({
                payload: {
                    compartments: this.getCompartments(),
                    constants: this.getConstants(),
                },
                parameters: dialogOutput.parameters,
            });
        } else if (isProcessingDialogOptimalControlValue(dialogOutput)) {
            observable = this.processingService.optimizeModel({
                payload: {
                    compartments: this.getCompartments(),
                    interventions: this.getInterventions(),
                    constants: this.getConstants(),
                },
                parameters: {
                    time: dialogOutput.parameters.time,
                    nodesAmount: dialogOutput.parameters.nodesAmount,
                    costFunction: dialogOutput.parameters.costFunction,
                    interventionNodesAmount:
                        dialogOutput.parameters.interventionNodesAmount,
                    interventionUpperBoundary:
                        dialogOutput.parameters.interventionUpperBoundary,
                    interventionLowerBoundary:
                        dialogOutput.parameters.interventionLowerBoundary,
                    interventionApproximationType:
                        dialogOutput.parameters.interventionApproximationType,
                },
            });
        } else if (isProcessingDialogPIValue(dialogOutput)) {
            const interventions: IIntervention[] = this.getInterventions();

            observable = this.processingService.identifyParameters({
                parameters: {
                    selectedConstants:
                        dialogOutput.parameters.selectedConstants,
                    timeStep: dialogOutput.parameters.timeStep,
                },
                payload: {
                    model: {
                        compartments: this.getCompartments(),
                        constants: this.getConstants().filter(
                            (constant: IConstant): boolean =>
                                !dialogOutput.parameters.selectedConstants.find(
                                    (
                                        selectedConstant: IPISelectedConstant
                                    ): boolean =>
                                        selectedConstant.name === constant.name
                                )
                        ),
                        ...(interventions.length && { interventions }),
                    },
                    solution: dialogOutput.solution,
                },
            });
        } else {
            return;
        }

        observable
            .pipe(
                tap(
                    (
                        results:
                            | ISimulationResponseData
                            | IOptimalControlResponseData
                            | IPIResponseData
                    ): void => {
                        if (results.success) {
                            this.resultsStorageService.addResults({
                                data: {
                                    parameters: results.parameters,
                                    payload: results.payload,
                                },
                            } as IResultsBody);

                            this.snackBar.open(
                                'Processing completed successfully',
                                'Dismiss',
                                {
                                    panelClass: 'snackbar',
                                    horizontalPosition: 'right',
                                    verticalPosition: 'bottom',
                                }
                            );

                            return;
                        }

                        this.snackBar.open(
                            'Processing failed.\n\n' +
                                `Error: ${results.error}`,
                            'Dismiss',
                            {
                                panelClass: 'snackbar',
                                horizontalPosition: 'right',
                                verticalPosition: 'bottom',
                            }
                        );
                    }
                )
            )
            .subscribe();
    }

    private getCompartments(): ICompartment[] {
        return this.modelService.getCompartments();
    }

    private getConstants(): IConstant[] {
        return this.modelService.getConstants();
    }

    private getInterventions(): IIntervention[] {
        return this.modelService.getInterventions();
    }

    private initWorkspace(): void {
        this.modelService.initWorkspaceFromSamples(['default.1', 'default']);
    }

    private onWindowResize(): void {
        this.layout();
    }
}
