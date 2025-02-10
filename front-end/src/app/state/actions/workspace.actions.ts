import { Model } from '@core/types/model.types';
import { createActionGroup, emptyProps, props } from '@ngrx/store';

interface AddWorkspaceProps {
    model?: Model;
}

interface SelectWorkspaceProps {
    name: string;
}

export const WorkspaceActions = createActionGroup({
    source: 'Workspace Component',
    events: {
        'Add Workspace': props<AddWorkspaceProps>(),
        'Select Workspace': props<SelectWorkspaceProps>(),
        'Remove Workspace': emptyProps(),
    },
});
