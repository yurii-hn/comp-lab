import { Model } from '@core/types/model.types';
import { createActionGroup, props } from '@ngrx/store';

interface ReplaceModelProps {
    model: Model;
}

export const DefinitionsTableActions = createActionGroup({
    source: 'Definitions Table Component',
    events: {
        'Update Model': props<ReplaceModelProps>(),
    },
});
