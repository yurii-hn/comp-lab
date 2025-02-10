import { Compartment } from '@core/types/model.types';
import { createActionGroup, props } from '@ngrx/store';

interface UpsertModelCompartmentProps {
    compartment: Compartment;
}

export const CompartmentDialogActions = createActionGroup({
    source: 'Compartment Dialog Component',
    events: {
        'Upsert Compartment': props<UpsertModelCompartmentProps>(),
    },
});
