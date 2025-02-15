import { Component, inject, Signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import {
  MAT_TOOLTIP_DEFAULT_OPTIONS,
  MatTooltipModule,
} from '@angular/material/tooltip';
import { TOOLTIP_DEFAULT_OPTIONS } from '@core/constants';
import { uniqueName } from '@core/validators';
import { Store } from '@ngrx/store';
import { filter, tap } from 'rxjs';
import { EditDialogComponent } from 'src/app/components/shared/edit-dialog/edit-dialog.component';
import { WorkspaceActions } from 'src/app/state/actions/workspace.actions';
import {
  selectCurrentWorkspaceName,
  selectWorkspaceNames,
  selectWorkspacesCount,
} from 'src/app/state/selectors/workspace.selectors';

@Component({
    selector: 'app-workspaces-panel',
    imports: [
        MatIconModule,
        MatSelectModule,
        MatButtonModule,
        MatTooltipModule,
        ReactiveFormsModule,
    ],
    providers: [
        {
            provide: MAT_TOOLTIP_DEFAULT_OPTIONS,
            useValue: TOOLTIP_DEFAULT_OPTIONS,
        },
    ],
    templateUrl: './workspaces-panel.component.html',
    styleUrls: ['./workspaces-panel.component.scss'],
})
export class WorkspacesPanelComponent {
    private readonly store: Store = inject(Store);
    private readonly dialogService: MatDialog = inject(MatDialog);

    public readonly currentWorkspaceName: Signal<string> =
        this.store.selectSignal(selectCurrentWorkspaceName);
    public readonly workspacesNames =
        this.store.selectSignal(selectWorkspaceNames);
    public readonly workspacesCount: Signal<number> = this.store.selectSignal(
        selectWorkspacesCount,
    );

    public add(): void {
        this.store.dispatch(WorkspaceActions.addWorkspace({}));
    }

    public edit(): void {
        const dialog: MatDialogRef<EditDialogComponent, string> =
            this.dialogService.open(EditDialogComponent, {
                autoFocus: false,
                disableClose: true,
                data: {
                    title: 'Workspace rename',
                    message: 'Enter new workspace name',
                    value: this.currentWorkspaceName(),
                    validationFns: [uniqueName(this.workspacesNames)],
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
                        WorkspaceActions.renameWorkspace({
                            name: newName,
                        }),
                    );
                }),
            )
            .subscribe();
    }

    public set({ value: name }: MatSelectChange): void {
        this.store.dispatch(WorkspaceActions.selectWorkspace({ name }));
    }

    public remove(): void {
        this.store.dispatch(WorkspaceActions.removeWorkspace());
    }
}
