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
import { DefinitionsTableDialogComponent } from './components/definitions-table-dialog/definitions-table-dialog.component';
import { FlowCreationDialogComponent } from './components/flow-creation-dialog/flow-creation-dialog.component';
import { ProcessingDialogComponent } from './components/processing-dialog/processing-dialog.component';
import { SimulationDashboardComponent } from './components/simulation-dashboard/simulation-dashboard.component';
import {
    ICompartment,
    ICompartmentBase,
    ICompartmentDefinition,
    IConstant,
    IEditCompartmentPayload,
    IExportModel,
    IImportModel,
    IIntervention,
    IOptimalControlParameters,
    IOptimalControlResponseData,
    IResultsBase,
    ISimulationParameters,
    ISimulationResponseData,
    IWorkspace,
} from './core/interfaces';
import { fromResizeObserver } from './core/utils';
import { ModelService } from './services/model.service';
import { ProcessingService } from './services/processing.service';
import { ResultsStorageService } from './services/results-storage.service';
import { WorkspacesService } from './services/workspaces.service';

interface IProcessingDialogSimulationOutput {
    parameters: ISimulationParameters;
    isOptimalControlProblem: false;
}

interface IProcessingDialogOptimalControlOutput {
    parameters: IOptimalControlParameters;
    isOptimalControlProblem: true;
}

type IProcessingDialogOutput =
    | IProcessingDialogSimulationOutput
    | IProcessingDialogOptimalControlOutput;

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
        const fileInput: HTMLInputElement = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.sc, .json';

        fileInput.onchange = (): void => {
            const file: File = fileInput.files![0];

            const fileReader: FileReader = new FileReader();

            fileReader.onload = (): void => {
                const model: IImportModel = JSON.parse(
                    fileReader.result as string
                );

                this.modelService.parseSample(model);

                this.layout();

                this.snackBar.open('Model imported successfully', 'Dismiss', {
                    panelClass: 'snackbar',
                    horizontalPosition: 'right',
                    verticalPosition: 'bottom',
                });
            };

            fileReader.readAsText(file);
        };

        fileInput.click();

        fileInput.remove();
    }

    public onModelExport(): void {
        const model: IExportModel = this.modelService.getModelExport();
        const modelString: string = JSON.stringify(model);

        const blob: Blob = new Blob([modelString], {
            type: 'application/json',
        });

        const url: string = URL.createObjectURL(blob);

        const anchor: HTMLAnchorElement = document.createElement('a');
        anchor.href = url;
        anchor.download = 'model.sc';

        anchor.click();

        URL.revokeObjectURL(url);

        anchor.remove();

        this.snackBar.open('Model export is ready for downloading', 'Dismiss', {
            panelClass: 'snackbar',
            horizontalPosition: 'right',
            verticalPosition: 'bottom',
        });
    }

    public onSimulationResultsDialog(): void {
        const simulationResultsDialog: MatDialogRef<SimulationDashboardComponent> =
            this.dialogService.open(SimulationDashboardComponent, {
                autoFocus: false,
                height: '95vh',
                width: '95vw',
            });
    }

    public onModelSimulateDialog(): void {
        const simulationDialog: MatDialogRef<ProcessingDialogComponent> =
            this.dialogService.open(ProcessingDialogComponent, {
                autoFocus: false,
            });

        this.subscriptions.add(
            simulationDialog
                .afterClosed()
                .pipe(
                    filter((output: IProcessingDialogOutput) =>
                        Boolean(output)
                    ),
                    tap(this.simulateModel.bind(this))
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

    private simulateModel(simulationData: IProcessingDialogOutput): void {
        let observable: Observable<
            ISimulationResponseData | IOptimalControlResponseData
        >;

        if (!simulationData.isOptimalControlProblem) {
            observable = this.processingService.simulateModel({
                payload: {
                    compartments: this.getCompartments(),
                },
                parameters: simulationData.parameters,
            });
        } else {
            const constants: IConstant[] = this.getConstants();

            observable = this.processingService.optimizeModel({
                payload: {
                    compartments: this.getCompartments(),
                    interventions: this.getInterventions(),
                },
                parameters: {
                    time: simulationData.parameters.time,
                    nodesAmount: simulationData.parameters.nodesAmount,
                    costFunction: constants.reduce(
                        (costFunction: string, constant: IConstant): string => {
                            return costFunction.replace(
                                new RegExp(`\\b${constant.name}\\b`),
                                constant.value.toString()
                            );
                        },
                        simulationData.parameters.costFunction
                    ),
                    interventionNodesAmount:
                        simulationData.parameters.interventionNodesAmount,
                    interventionUpperBoundary:
                        simulationData.parameters.interventionUpperBoundary,
                    interventionLowerBoundary:
                        simulationData.parameters.interventionLowerBoundary,
                    interventionApproximationType:
                        simulationData.parameters.interventionApproximationType,
                },
            });
        }

        observable
            .pipe(
                tap(
                    (
                        results:
                            | ISimulationResponseData
                            | IOptimalControlResponseData
                    ) => {
                        if (results.success) {
                            this.resultsStorageService.addResults({
                                data: results,
                            } as IResultsBase);

                            this.snackBar.open(
                                'Simulation completed successfully',
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
                            'Simulation failed.\n\n' +
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
        const constants: IConstant[] = this.getConstants();

        return this.modelService.getCompartments(constants);
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
