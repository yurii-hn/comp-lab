import { createActionGroup, props } from '@ngrx/store';
import { RunsState } from 'src/app/state/reducers/runs.reducer';
import { SettingsState } from 'src/app/state/reducers/settings.reducer';
import { WorkspacesState } from 'src/app/state/reducers/workspace.reducer';

interface LoadWorkspacesProps {
    state: WorkspacesState;
}

interface LoadRunsProps {
    state: RunsState;
}

interface LoadSettingsProps {
    state: SettingsState;
}

export const LocalStorageActions = createActionGroup({
    source: 'Local Storage',
    events: {
        'Load Workspaces': props<LoadWorkspacesProps>(),
        'Load Runs': props<LoadRunsProps>(),
        'Load Settings': props<LoadSettingsProps>(),
    },
});
