import { Component, inject, Signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { Store } from '@ngrx/store';
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
        ReactiveFormsModule,
    ],
    templateUrl: './workspaces-panel.component.html',
    styleUrls: ['./workspaces-panel.component.scss'],
})
export class WorkspacesPanelComponent {
    private readonly store: Store = inject(Store);

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

    public set({ value: name }: MatSelectChange): void {
        this.store.dispatch(WorkspaceActions.selectWorkspace({ name }));
    }

    public remove(): void {
        this.store.dispatch(WorkspaceActions.removeWorkspace());
    }
}
