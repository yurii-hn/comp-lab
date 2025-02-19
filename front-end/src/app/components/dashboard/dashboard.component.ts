import {
  Component,
  effect,
  EventEmitter,
  inject,
  Injector,
  OnInit,
  Signal,
  untracked,
  viewChildren,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Data } from '@core/types/run.types';
import { uniqueName } from '@core/validators';
import { Store } from '@ngrx/store';
import { PlotlyComponent, PlotlyModule } from 'angular-plotly.js';
import { AngularSplitModule } from 'angular-split';
import PlotlyJS, { Config } from 'plotly.js-dist-min';
import { combineLatest, filter, take, tap } from 'rxjs';
import {
  DashboardStore,
  Plot,
  SplitAreasSizes,
} from 'src/app/components/dashboard/dashboard.store';
import { OptimalControlInfoPanelComponent } from 'src/app/components/dashboard/optimal-control-info-panel/optimal-control-info-panel.component';
import { ParametersIdentificationInfoPanelComponent } from 'src/app/components/dashboard/parameters-identification-info-panel/parameters-identification-info-panel.component';
import { SimulationInfoPanelComponent } from 'src/app/components/dashboard/simulation-info-panel/simulation-info-panel.component';
import { EditDialogComponent } from 'src/app/components/shared/edit-dialog/edit-dialog.component';
import { DashboardActions } from 'src/app/state/actions/dashboard.actions';
import { ConfirmationDialogComponent } from '../shared/confirmation-dialog/confirmation-dialog.component';

PlotlyModule.plotlyjs = PlotlyJS;

@Component({
    selector: 'app-dashboard',
    imports: [
        ReactiveFormsModule,
        MatIconModule,
        MatSelectModule,
        MatButtonModule,
        MatTooltipModule,
        MatDividerModule,
        PlotlyModule,
        AngularSplitModule,
        SimulationInfoPanelComponent,
        OptimalControlInfoPanelComponent,
        ParametersIdentificationInfoPanelComponent,
    ],
    providers: [DashboardStore],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
    private readonly injector: Injector = inject(Injector);
    private readonly store: Store = inject(Store);
    private readonly localStore = inject(DashboardStore);
    private readonly dialogRef: MatDialogRef<DashboardComponent, Data | void> =
        inject(MatDialogRef<DashboardComponent, Data | void>);
    private readonly dialogService: MatDialog = inject(MatDialog);

    private readonly plotsComponents: Signal<readonly PlotlyComponent[]> =
        viewChildren(PlotlyComponent);

    public readonly splitSizes: Signal<SplitAreasSizes> =
        this.localStore.splitAreasSizes;
    public readonly noRuns: Signal<boolean> = this.localStore.noRuns;
    public readonly names: Signal<string[]> = this.localStore.runsNames;
    public readonly name: Signal<string | null> =
        this.localStore.currentRunName;
    public readonly data: Signal<Data | null> = this.localStore.currentRunData;
    public readonly plots: Signal<Plot[]> = this.localStore.currentRunPlotsData;
    public readonly plotsConfig: Signal<Partial<Config>> =
        this.localStore.plotsConfig;
    public readonly plotStyle: Signal<Record<string, string>> =
        this.localStore.plotStyle;

    public ngOnInit(): void {
        effect(
            (): void => {
                const components: readonly PlotlyComponent[] =
                    this.plotsComponents();

                untracked((): void => {
                    combineLatest(
                        components.map(
                            (
                                component: PlotlyComponent,
                            ): EventEmitter<unknown> => component.afterPlot,
                        ),
                    )
                        .pipe(
                            take(1),
                            tap((): void => {
                                components.forEach(
                                    (component: PlotlyComponent): void => {
                                        if (
                                            !component.resizeHandler ||
                                            !component.plotlyInstance
                                        ) {
                                            return;
                                        }

                                        component.resizeHandler(
                                            component.plotlyInstance,
                                        );
                                    },
                                );
                            }),
                        )
                        .subscribe();
                });
            },
            {
                injector: this.injector,
            },
        );
    }

    public onGutterDBClick(): void {
        this.localStore.alternateSplitAreasSizes();
    }

    public onClose(): void {
        this.dialogRef.close();
    }

    public set({ value: name }: MatSelectChange): void {
        this.store.dispatch(DashboardActions.selectRun({ name }));
    }

    public edit(): void {
        const dialog: MatDialogRef<EditDialogComponent, string> =
            this.dialogService.open(EditDialogComponent, {
                autoFocus: false,
                disableClose: true,
                data: {
                    title: 'Run rename',
                    message: 'Enter new run name',
                    value: this.localStore.currentRunName(),
                    validationFns: [uniqueName(this.localStore.runsNames)],
                },
            });

        dialog
            .afterClosed()
            .pipe(
                filter(
                    (newName?: string): newName is string =>
                        newName !== undefined,
                ),
                tap((newName: string): void => {
                    this.store.dispatch(
                        DashboardActions.renameRun({
                            name: newName,
                        }),
                    );
                }),
            )
            .subscribe();
    }

    public remove(): void {
        this.store.dispatch(DashboardActions.removeRun());
    }

    public add(): void {
        this.store.dispatch(DashboardActions.addRun());
    }

    public get(): void {
        const dialog: MatDialogRef<ConfirmationDialogComponent, boolean> =
            this.dialogService.open(ConfirmationDialogComponent, {
                data: {
                    title: 'Export run',
                    message: 'What you want to export?',
                    confirmText: 'Values and parameters',
                    cancelText: 'Values only',
                },
            });

        dialog
            .afterClosed()
            .pipe(
                filter(
                    (withParameters?: boolean): withParameters is boolean =>
                        withParameters !== undefined,
                ),
                tap((withParameters: boolean): void => {
                    if (withParameters) {
                        this.store.dispatch(DashboardActions.exportRunData());

                        return;
                    }

                    this.store.dispatch(DashboardActions.exportRunValues());
                }),
            )
            .subscribe();
    }

    public rerun(): void {
        this.dialogRef.close(this.localStore.currentRunData()!);
    }

    public extract(): void {
        this.store.dispatch(
            DashboardActions.extractModel({
                model: this.localStore.currentRunData()!.model,
            }),
        );

        this.dialogRef.close();
    }
}
