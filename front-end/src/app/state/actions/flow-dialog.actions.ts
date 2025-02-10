import { Flow } from '@core/types/model.types';
import { createActionGroup, props } from '@ngrx/store';

interface UpsertModelFlowProps {
    flow: Flow;
}

export const FlowDialogActions = createActionGroup({
    source: 'Flow Dialog Component',
    events: {
        'Upsert Flow': props<UpsertModelFlowProps>(),
    },
});
