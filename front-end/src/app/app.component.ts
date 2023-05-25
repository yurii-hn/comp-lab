import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import cytoscape, {
    EdgeCollection,
    EdgeSingular,
    EventObject,
    NodeSingular,
    SingularElementArgument,
} from 'cytoscape';
import edgehandles from 'cytoscape-edgehandles';
import { Subscription, filter, map, tap } from 'rxjs';
import { CompartmentCreationDialogComponent } from './components/compartment-creation-dialog/compartment-creation-dialog.component';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { FlowCreationDialogComponent } from './components/flow-creation-dialog/flow-creation-dialog.component';
import { SimulationDashboardComponent } from './components/simulation-dashboard/simulation-dashboard.component';
import { SimulationDialogComponent } from './components/simulation-dialog/simulation-dialog.component';
import { cytoscapeLayoutOptions, cytoscapeOptions } from './core/constants';
import {
    ICompartment,
    ICompartmentBase,
    IFlow,
    ISimulationParameters,
    ISimulationResults,
} from './core/interfaces';
import { SimulationService } from './services/simulation.service';

cytoscape.use(edgehandles);

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent {
    public simulationResults!: ISimulationResults;

    public get elementSelected(): boolean {
        return (
            this.cytoscapeObj &&
            this.cytoscapeObj.elements(':selected').length > 0
        );
    }

    public get compartmentsCount(): number {
        return this.cytoscapeObj && this.cytoscapeObj.nodes().length;
    }

    public get isModelValid(): boolean {
        return true;
    }

    @ViewChild('canvas') private readonly canvas!: ElementRef<HTMLElement>;

    private cytoscapeObj!: cytoscape.Core;
    private edgehandles!: edgehandles.EdgeHandlesInstance;

    private readonly subscriptions: Subscription = new Subscription();

    constructor(
        private readonly dialogService: MatDialog,
        private readonly simulationService: SimulationService
    ) {}

    public ngAfterViewInit(): void {
        this.cytoscapeObj = cytoscape({
            container: this.canvas.nativeElement,
            ...cytoscapeOptions,
        });

        this.cytoscapeObj.on('cxttapend', 'node', (event) => {
            this.edgehandles.start(event.target);
        });

        this.cytoscapeObj.on(
            'ehcomplete',
            this.onFlowCreationDialog.bind(this) as any
        );

        this.edgehandles = this.cytoscapeObj.edgehandles();

        this.tempInitLayout();

        this.layout();
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
        this.cytoscapeObj.elements().layout(cytoscapeLayoutOptions).run();
    }

    public onDeleteElementDialog(): void {
        const selectedElement: SingularElementArgument = this.cytoscapeObj
            .elements(':selected')
            .first();

        const deletionSubject: string =
            selectedElement.group() === 'nodes' ? 'compartment' : 'flow';

        const deletionDialog: MatDialogRef<ConfirmationDialogComponent> =
            this.dialogService.open(ConfirmationDialogComponent, {
                data: {
                    title: `Delete ${deletionSubject}}`,
                    message: `Are you sure you want to delete the selected ${deletionSubject}?`,
                },
                autoFocus: false,
            });

        this.subscriptions.add(
            deletionDialog
                .afterClosed()
                .pipe(
                    filter((confirmed: boolean) => confirmed),
                    tap(this.deleteElement.bind(this))
                )
                .subscribe()
        );
    }

    public onClearCompartmentsDialog(): void {
        const clearingDialog: MatDialogRef<ConfirmationDialogComponent> =
            this.dialogService.open(ConfirmationDialogComponent, {
                data: {
                    title: 'Clear compartments',
                    message:
                        'Are you sure you want to delete all compartments?',
                },
                autoFocus: false,
            });

        this.subscriptions.add(
            clearingDialog
                .afterClosed()
                .pipe(
                    filter((confirmed: boolean) => confirmed),
                    tap(this.clearCompartments.bind(this))
                )
                .subscribe()
        );
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
                    filter((simulationParameters: ISimulationParameters) =>
                        Boolean(simulationParameters)
                    ),
                    tap(this.simulateModel.bind(this))
                )
                .subscribe()
        );
    }

    public onSimulationResultsDialog(): void {
        const simulationResultsDialog: MatDialogRef<SimulationDashboardComponent> =
            this.dialogService.open(SimulationDashboardComponent, {
                autoFocus: false,
                data: this.simulationResults,
                maxWidth: '95vw',
                width: '95vw',
                maxHeight: '95vh',
                height: '95vh',
            });
    }

    private onFlowCreationDialog(
        event: EventObject,
        sourceNode: NodeSingular,
        targetNode: NodeSingular,
        addedEdge: EdgeSingular
    ): void {
        const creationDialog: MatDialogRef<FlowCreationDialogComponent> =
            this.dialogService.open(FlowCreationDialogComponent, {
                autoFocus: false,
            });

        this.subscriptions.add(
            creationDialog
                .afterClosed()
                .pipe(
                    tap((flow: IFlow) => {
                        if (!flow) {
                            addedEdge.remove();
                        }
                    }),
                    filter((flow: IFlow) => Boolean(flow)),
                    map((flow: IFlow): [IFlow, EdgeSingular] => [
                        flow,
                        addedEdge,
                    ]),
                    tap(this.addFlow.bind(this))
                )
                .subscribe()
        );
    }

    private addCompartment(compartmentData: ICompartmentBase): void {
        this.cytoscapeObj.add({
            group: 'nodes',
            data: {
                id: compartmentData.id,
                initialValue: compartmentData.initialValue,
            },
        });
    }

    private addFlow([flowData, flowEdge]: [IFlow, EdgeSingular]): void {
        flowEdge.data('ratio', flowData.ratio);
        flowEdge.data('value', flowData.value);
    }

    private deleteElement(): void {
        this.cytoscapeObj.remove(':selected');
    }

    private clearCompartments(): void {
        this.cytoscapeObj.remove('node');
    }

    private simulateModel(simulationParameters: ISimulationParameters): void {
        this.simulationService
            .simulateModel({
                compartments: this.getCompartments(),
                simulationParameters,
            })
            .pipe(
                tap((results: ISimulationResults) => {
                    this.simulationResults = results;
                })
            )
            .subscribe();
    }

    private getCompartments(): ICompartment[] {
        return this.cytoscapeObj.nodes().map(
            (node: NodeSingular): ICompartment => ({
                id: node.id(),
                initialValue: node.data('initialValue'),
                inflows: this.getFlows(node.incomers().edges()),
                outflows: this.getFlows(node.outgoers().edges()),
            })
        );
    }

    private getFlows(flowEdges: EdgeCollection): IFlow[] {
        return flowEdges.map(
            (flowEdge: EdgeSingular): IFlow => ({
                ratio: flowEdge.data('ratio'),
                value: flowEdge.data('value'),
            })
        );
    }

    private tempInitLayout(): void {
        this.cytoscapeObj.add({
            group: 'nodes',
            data: {
                id: 'S',
                initialValue: 1000,
            },
        });

        this.cytoscapeObj.add({
            group: 'nodes',
            data: {
                id: 'I',
                initialValue: 1,
            },
        });

        this.cytoscapeObj.add({
            group: 'nodes',
            data: {
                id: 'R',
                initialValue: 0,
            },
        });

        this.cytoscapeObj.add({
            group: 'edges',
            data: {
                ratio: 0.001,
                value: 'S*I',
                source: 'S',
                target: 'I',
            },
        });

        this.cytoscapeObj.add({
            group: 'edges',
            data: {
                ratio: 0.1,
                value: 'I',
                source: 'I',
                target: 'R',
            },
        });
    }
}
