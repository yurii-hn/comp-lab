import {
  AfterViewInit,
  Component,
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
import { Store } from '@ngrx/store';
import { EdgeSingular, NodeSingular, SingularElementArgument } from 'cytoscape';
import { filter, tap } from 'rxjs';
import { AppStore } from 'src/app/app.store';
import { WorkspacesPanelComponent } from 'src/app/components/workspaces-panel/workspaces-panel.component';
import { GraphService } from 'src/app/services/graph.service';
import { AppActions } from 'src/app/state/actions/app.actions';
import { selectHasCompartments } from 'src/app/state/selectors/workspace.selectors';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { DefinitionsTableDialogComponent } from './components/definitions-table-dialog/definitions-table-dialog.component';
import { CompartmentDialogComponent } from './components/graph/compartment-dialog/compartment-dialog.component';
import { FlowDialogComponent } from './components/graph/flow-dialog/flow-dialog.component';
import { ProcessingDialogComponent } from './components/processing/processing-dialog/processing-dialog.component';
import { ConfirmationDialogComponent } from './components/shared/confirmation-dialog/confirmation-dialog.component';

@Component({
    selector: 'app-root',
    imports: [MatIconModule, MatButtonModule, WorkspacesPanelComponent],
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

    public ngOnInit(): void {
        effect(
            (): void => {
                const openedElement: SingularElementArgument | null =
                    this.localStore.openedElement();

                if (!openedElement) {
                    return;
                }

                untracked((): void => {
                    if (openedElement.group() === 'nodes') {
                        this.onCompartmentOpen(openedElement as NodeSingular);

                        return;
                    }

                    this.onFlowOpen(openedElement as EdgeSingular);
                });
            },
            {
                injector: this.injector,
            },
        );
    }

    public ngAfterViewInit(): void {
        this.localStore.initGraph(this.canvas().nativeElement);

        this.store.dispatch(
            AppActions.importSampleModel({
                path: 'sir.scm',
                createNewWorkspace: false,
            }),
        );
        this.store.dispatch(
            AppActions.importSampleModel({
                path: 'interventions.scm',
                createNewWorkspace: true,
            }),
        );
        this.store.dispatch(
            AppActions.importSampleModel({
                path: 'seird.scm',
                createNewWorkspace: true,
            }),
        );
    }

    public onDefinitionsTable(): void {
        this.dialogService.open(DefinitionsTableDialogComponent, {
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

    public onDashboard(): void {
        this.dialogService.open(DashboardComponent, {
            autoFocus: false,
            disableClose: true,
            maxWidth: '100vw',
            maxHeight: '100vh',
        });
    }

    public onProcess(): void {
        this.dialogService.open(ProcessingDialogComponent, {
            autoFocus: false,
            disableClose: true,
        });
    }

    public onDelete(): void {
        const selectedElement: SingularElementArgument | null =
            this.localStore.selectedElement();

        if (!selectedElement) {
            return;
        }

        const isCompartment: boolean = selectedElement.group() === 'nodes';
        const id: string = selectedElement.id();

        const deletionSubject: string = isCompartment ? 'compartment' : 'flow';

        const dialog: MatDialogRef<ConfirmationDialogComponent, boolean> =
            this.dialogService.open(ConfirmationDialogComponent, {
                autoFocus: false,
                disableClose: true,
                data: {
                    title: `Delete ${deletionSubject}`,
                    message: `Are you sure you want to delete the selected ${deletionSubject}?`,
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
        const dialog: MatDialogRef<CompartmentDialogComponent, void> =
            this.dialogService.open(CompartmentDialogComponent, {
                autoFocus: false,
                disableClose: true,
                data: node?.data(),
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
        const dialog: MatDialogRef<FlowDialogComponent, void> =
            this.dialogService.open(FlowDialogComponent, {
                autoFocus: false,
                data: edge.data(),
            });

        dialog
            .afterClosed()
            .pipe(
                tap((): void => {
                    if (edge.data('equation') === undefined) {
                        edge.remove();
                    }

                    this.localStore.resetOpenedElement();
                }),
            )
            .subscribe();
    }
}
