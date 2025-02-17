import {
  AfterViewInit,
  Component,
  ComponentRef,
  ElementRef,
  Injector,
  OnInit,
  Signal,
  effect,
  inject,
  untracked,
  viewChild,
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Compartment, Flow } from '@core/types/model.types';
import { Store } from '@ngrx/store';
import { AngularSplitModule } from 'angular-split';
import { EdgeSingular, NodeSingular } from 'cytoscape';
import { filter, tap } from 'rxjs';
import { AppStore, SplitAreasSizes } from 'src/app/app.store';
import { CompartmentComponent } from 'src/app/components/graph/compartment/compartment.component';
import { EmptyFlow } from 'src/app/components/graph/edit-flow/edit-flow.store';
import { FlowComponent } from 'src/app/components/graph/flow/flow.component';
import { InfoComponent } from 'src/app/components/info/info.component';
import { SettingsComponent } from 'src/app/components/settings/settings.component';
import { WorkspacesPanelComponent } from 'src/app/components/workspaces-panel/workspaces-panel.component';
import { GraphService } from 'src/app/services/graph.service';
import { AppActions } from 'src/app/state/actions/app.actions';
import { selectHasCompartments } from 'src/app/state/selectors/workspace.selectors';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { DefinitionsTableComponent } from './components/definitions-table/definitions-table.component';
import { EditCompartmentComponent } from './components/graph/edit-compartment/edit-compartment.component';
import { EditFlowComponent } from './components/graph/edit-flow/edit-flow.component';
import { ProcessingComponent } from './components/processing/processing/processing.component';
import { ConfirmationDialogComponent } from './components/shared/confirmation-dialog/confirmation-dialog.component';

@Component({
    selector: 'app-root',
    imports: [
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        AngularSplitModule,
        InfoComponent,
        WorkspacesPanelComponent,
    ],
    providers: [GraphService, AppStore],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit {
    private readonly injector: Injector = inject(Injector);
    private readonly localStore = inject(AppStore);
    private readonly store: Store = inject(Store);
    private readonly dialogService: MatDialog = inject(MatDialog);

    private readonly canvas: Signal<ElementRef<HTMLDivElement>> =
        viewChild.required<ElementRef<HTMLDivElement>>('canvas');

    public readonly isElementSelected: Signal<boolean> =
        this.localStore.isElementSelected;
    public readonly hasCompartments: Signal<boolean> = this.store.selectSignal(
        selectHasCompartments,
    );
    public readonly splitSizes: Signal<SplitAreasSizes> =
        this.localStore.splitAreasSizes;

    public ngOnInit(): void {
        effect(
            (): void => {
                const openedElement: NodeSingular | EdgeSingular | null =
                    this.localStore.openedElement();

                if (!openedElement) {
                    return;
                }

                untracked((): void => {
                    if (openedElement.isNode()) {
                        this.onCompartmentOpen(openedElement);

                        return;
                    }

                    this.onFlowOpen(openedElement);
                });
            },
            {
                injector: this.injector,
            },
        );
    }

    public ngAfterViewInit(): void {
        this.localStore.initGraph(this.canvas().nativeElement);

        this.store.dispatch(AppActions.loadWorkspacesFromLocalStorage());
        this.store.dispatch(AppActions.loadRunsFromLocalStorage());
        this.store.dispatch(AppActions.loadSettingsFromLocalStorage());

        this.store.dispatch(AppActions.syncInit());

        // TODO: Make some kind of menu to select samples from
        // this.store.dispatch(
        //     AppActions.importSampleModel({
        //         path: 'sir.scm',
        //         select: true,
        //     }),
        // );
        // this.store.dispatch(
        //     AppActions.importSampleModel({
        //         path: 'interventions.scm',
        //         select: false,
        //     }),
        // );
        // this.store.dispatch(
        //     AppActions.importSampleModel({
        //         path: 'seird.scm',
        //         select: false,
        //     }),
        // );
    }

    public onGutterDBClick(): void {
        this.localStore.alternateSplitAreas();
    }

    public onDefinitionsTable(): void {
        this.dialogService.open(DefinitionsTableComponent, {
            autoFocus: false,
            disableClose: true,
        });
    }

    public onLayout(): void {
        this.localStore.layoutGraph();
    }

    public onClear(): void {
        const dialog: MatDialogRef<ConfirmationDialogComponent, boolean> =
            this.dialogService.open(ConfirmationDialogComponent, {
                autoFocus: false,
                disableClose: true,
                data: {
                    title: 'Clear model',
                    message:
                        'Are you sure you want to delete whole model?' +
                        '\n\nAll constants will remain intact',
                },
            });

        dialog
            .afterClosed()
            .pipe(
                filter(
                    (confirmed?: boolean): confirmed is boolean => !!confirmed,
                ),
                tap((): void => {
                    this.store.dispatch(
                        AppActions.clearModel({
                            constants: false,
                        }),
                    );
                }),
            )
            .subscribe();
    }

    public onImport(): void {
        this.store.dispatch(AppActions.importModel());
    }

    public onExport(): void {
        this.store.dispatch(AppActions.exportModel());
    }

    public onSettings(): void {
        this.dialogService.open(SettingsComponent, {
            autoFocus: false,
            disableClose: true,
        });
    }

    public onDashboard(): void {
        this.dialogService.open(DashboardComponent, {
            autoFocus: false,
            disableClose: true,
        });
    }

    public onProcess(): void {
        this.dialogService.open(ProcessingComponent, {
            autoFocus: false,
            disableClose: true,
        });
    }

    public onDelete(): void {
        const selectedElement: NodeSingular | EdgeSingular | null =
            this.localStore.selectedElement();

        if (!selectedElement) {
            return;
        }

        const id: string = selectedElement.id();
        const isCompartment: boolean = selectedElement.isNode();

        const subject: string = isCompartment ? 'compartment' : 'flow';

        const dialog: MatDialogRef<ConfirmationDialogComponent, boolean> =
            this.dialogService.open(ConfirmationDialogComponent, {
                autoFocus: false,
                disableClose: true,
                data: {
                    title: `Delete ${subject}`,
                    message: `Are you sure you want to delete the selected ${subject}?`,
                },
            });

        dialog
            .afterClosed()
            .pipe(
                filter((confirmed?: boolean): boolean => !!confirmed),
                tap((): void => {
                    if (isCompartment) {
                        this.store.dispatch(
                            AppActions.removeCompartment({
                                id,
                            }),
                        );

                        return;
                    }

                    this.store.dispatch(
                        AppActions.removeFlow({
                            id,
                        }),
                    );
                }),
            )
            .subscribe();
    }

    public onCompartmentOpen(node?: NodeSingular): void {
        const componentRef: ComponentRef<CompartmentComponent> | undefined =
            node?.data('componentRef');
        const data: Compartment | undefined = componentRef?.instance.data();

        const dialog: MatDialogRef<EditCompartmentComponent, void> =
            this.dialogService.open(EditCompartmentComponent, {
                autoFocus: false,
                disableClose: true,
                data,
            });

        dialog
            .afterClosed()
            .pipe(
                tap((): void => {
                    this.localStore.resetOpenedElement();
                }),
            )
            .subscribe();
    }

    private onFlowOpen(edge: EdgeSingular): void {
        const componentRef: ComponentRef<FlowComponent> | undefined =
            edge.data('componentRef');
        const data: Flow | EmptyFlow = componentRef?.instance.data() ?? {
            source: edge.data('source'),
            target: edge.data('target'),
        };

        const dialog: MatDialogRef<EditFlowComponent, void> =
            this.dialogService.open(EditFlowComponent, {
                autoFocus: false,
                data,
            });

        dialog
            .afterClosed()
            .pipe(
                tap((): void => {
                    if (componentRef === undefined) {
                        edge.remove();
                    }

                    this.localStore.resetOpenedElement();
                }),
            )
            .subscribe();
    }
}
