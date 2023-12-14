import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
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
    IImportModel,
    IIntervention,
    ISimulationParameters,
    ISimulationResults,
} from './core/interfaces';
import { SamplesService } from './services/model-samples.service';
import { ModelService } from './services/model.service';
import { SimulationService } from './services/simulation.service';

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
    public simulationResults!: ISimulationResults;

    public get elementSelected(): boolean {
        return !!this.modelService.selectedElement;
    }

    public get compartmentsCount(): number {
        return this.modelService.compartmentsCount;
    }

    @ViewChild('canvas') private readonly canvas!: ElementRef<HTMLElement>;

    private readonly subscriptions: Subscription = new Subscription();

    constructor(
        private readonly dialogService: MatDialog,
        private readonly simulationService: SimulationService,
        private readonly modelService: ModelService,
        private readonly samplesService: SamplesService
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

        this.loadSample();

        this.subscriptions.add(compartmentOpeningSub);
        this.subscriptions.add(fromOpeningSub);
        this.subscriptions.add(flowAddSub);
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
                    message: 'Are you sure you want to delete whole model?' +
                    '\n\nAll constants will remain intact'
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
                    this.simulationResults = results;
                })
            )
            .subscribe();
    }

    private getCompartments(): ICompartment[] {
        const constants: IConstant[] = this.getConstants();

        return this.modelService.getCompartments(constants);
    }

    private getConstants(): IConstant[] {
        return this.modelService.getDefinitionsTable().constants.map(
            (constant: IConstant): IConstant => ({
                name: constant.name,
                value: constant.value,
            })
        );
    }

    private getInterventions(): IIntervention[] {
        return this.modelService.getDefinitionsTable().interventions.map(
            (intervention: IIntervention): IIntervention => ({
                name: intervention.name,
            })
        );
    }

    private loadSample(): void {
        this.samplesService
            .getSample('default')
            .pipe(
                tap(this.parseSample.bind(this)),
                tap((): void => {
                    this.layout();
                })
            )
            .subscribe();
    }

    private parseSample(sample: IImportModel): void {
        this.modelService.parseSample(sample);
    }
}
