import { Flow } from '@core/types/model.types';
import { createActionGroup, props } from '@ngrx/store';

interface UpsertModelFlowProps {
    flow: Flow;
}

export const EditFlowActions = createActionGroup({
    source: 'Edit Flow Component',
    events: {
        'Upsert Flow': props<UpsertModelFlowProps>(),
    },
});
