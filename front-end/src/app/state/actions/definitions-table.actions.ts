import { Model } from '@core/types/model.types';
import { createActionGroup, props } from '@ngrx/store';

interface UpdateDefinitionsProps {
    definitions: Omit<Model, 'flows'>;
}

export const DefinitionsTableActions = createActionGroup({
    source: 'Definitions Table Component',
    events: {
        'Update Definitions': props<UpdateDefinitionsProps>(),
    },
});
