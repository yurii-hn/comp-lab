import { Compartment } from '@core/types/model.types';
import { createActionGroup, props } from '@ngrx/store';

interface UpsertModelCompartmentProps {
    compartment: Compartment;
}

export const EditCompartmentActions = createActionGroup({
    source: 'Edit Compartment Component',
    events: {
        'Upsert Compartment': props<UpsertModelCompartmentProps>(),
    },
});
