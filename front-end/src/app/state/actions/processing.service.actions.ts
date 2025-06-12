import { Result } from '@core/types/run.types';
import { createActionGroup, props } from '@ngrx/store';

interface AddRunProps {
    data: Result;
    set: boolean;
}

export const ProcessingServiceActions = createActionGroup({
    source: 'Processing Service',
    events: {
        'Model Processing Success': props<AddRunProps>(),
    },
});
