import { Model } from '@core/types/model.types';
import { createActionGroup, emptyProps, props } from '@ngrx/store';

interface AddWorkspaceProps {
    model?: Model;
}

interface RenameWorkspaceProps {
    name: string;
}

interface SelectWorkspaceProps {
    name: string;
}

export const WorkspaceActions = createActionGroup({
    source: 'Workspace Component',
    events: {
        'Add Workspace': props<AddWorkspaceProps>(),
        'Rename Workspace': props<RenameWorkspaceProps>(),
        'Select Workspace': props<SelectWorkspaceProps>(),
        'Remove Workspace': emptyProps(),
    },
});
