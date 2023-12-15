import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EdgeSingular, NodeSingular, SingularElementArgument } from 'cytoscape';
import { Observable, Subscription, filter, map, tap } from 'rxjs';
import { CompartmentCreationDialogComponent } from './components/compartment-creation-dialog/compartment-creation-dialog.component';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { DefinitionsTableDialogComponent } from './components/definitions-table-dialog/definitions-table-dialog.component';
import { FlowCreationDialogComponent } from './components/flow-creation-dialog/flow-creation-dialog.component';
import { SimulationDashboardComponent } from './components/simulation-dashboard/simulation-dashboard.component';
import { SimulationDialogComponent } from './components/simulation-dialog/simulation-dialog.component';
import {
    ICompartment,
    ICompartmentBase,
    ICompartmentDefinition,
    IConstant,
    IEditCompartmentPayload,
    IExportModel,
    IImportModel,
    IIntervention,
    ISimulationParameters,
    ISimulationResults,
    ISimulationResultsSuccess,
} from './core/interfaces';
import { ModelService } from './services/model.service';
import { SimulationService } from './services/simulation.service';
import { WorkspacesService } from './services/workspaces.service';

interface ISimulationDialogOutput {
    simulationParameters: ISimulationParameters;
    costFunction: string;
    isOptimalControlProblem: boolean;
}

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent {
    public simulationResults: ISimulationResultsSuccess | null = null;
    public readonly workspaceControl: FormControl = new FormControl();

    public get elementSelected(): boolean {
        return !!this.modelService.selectedElement;
    }

    public get compartmentsCount(): number {
        return this.modelService.compartmentsCount;
    }

    public get workspaces(): string[] {
        return this.workspacesService.getWorkspaceNames();
    }

    @ViewChild('canvas') private readonly canvas!: ElementRef<HTMLElement>;

    private readonly subscriptions: Subscription = new Subscription();

    constructor(
        private readonly dialogService: MatDialog,
        private readonly simulationService: SimulationService,
        private readonly modelService: ModelService,
        private readonly workspacesService: WorkspacesService,
        private readonly snackBar: MatSnackBar
    ) {}

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

        const workspaceChangeSub: Subscription =
            this.workspacesService.currentWorkspaceName$
                .pipe(
                    tap((workspaceName: string): void => {
                        this.workspaceControl.setValue(workspaceName);
                    })
                )
                .subscribe();

        this.initWorkspace();

        this.subscriptions.add(compartmentOpeningSub);
        this.subscriptions.add(fromOpeningSub);
        this.subscriptions.add(flowAddSub);
        this.subscriptions.add(workspaceChangeSub);
    }

    public onWorkspaceChange(workspaceName: string): void {
        this.modelService.changeWorkspace(workspaceName);
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
                data: this.simulationResults,
                height: '95vh',
                width: '95vw',
            });
    }

    public onModelSimulateDialog(): void {
        const simulationDialog: MatDialogRef<SimulationDialogComponent> =
            this.dialogService.open(SimulationDialogComponent, {
                autoFocus: false,
            });

        this.subscriptions.add(
            simulationDialog
                .afterClosed()
                .pipe(
                    filter((output: ISimulationDialogOutput) =>
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

    private simulateModel(simulationData: ISimulationDialogOutput): void {
        let observable: Observable<ISimulationResults>;

        this.simulationResults = null;

        if (!simulationData.isOptimalControlProblem) {
            observable = this.simulationService.simulateModel({
                model: this.getCompartments(),
                simulationParameters: {
                    step: simulationData.simulationParameters.step,
                    time: simulationData.simulationParameters.time,
                },
            });
        } else {
            const constants: IConstant[] = this.getConstants();

            observable = this.simulationService.optimizeModel({
                model: this.getCompartments(),
                simulationParameters: {
                    step: simulationData.simulationParameters.step,
                    time: simulationData.simulationParameters.time,
                },
                costFunction: constants.reduce(
                    (costFunction: string, constant: IConstant) => {
                        return costFunction.replace(
                            new RegExp(`\\b${constant.name}\\b`),
                            constant.value.toString()
                        );
                    },
                    simulationData.costFunction
                ),
                interventions: this.getInterventions(),
            });
        }

        observable
            .pipe(
                tap((results: ISimulationResults) => {
                    if (results.success) {
                        this.simulationResults = results;

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
                        'Simulation failed.\n\n' + `Error: ${results.error}`,
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
        this.modelService.initWorkspaceFromSample('default');
    }
}
