import { Model } from '@core/types/model.types';
import { createActionGroup, emptyProps, props } from '@ngrx/store';

interface RenameRunProps {
    name: string;
}

interface SelectRunProps {
    name: string;
}

interface ExtractModelProps {
    model: Model;
}

export const DashboardActions = createActionGroup({
    source: 'Dashboard Component',
    events: {
        'Add Run': emptyProps(),
        'Rename Run': props<RenameRunProps>(),
        'Select Run': props<SelectRunProps>(),
        'Remove Run': emptyProps(),
        'Export Run Data': emptyProps(),
        'Export Run Values': emptyProps(),
        'Extract Model': props<ExtractModelProps>(),
    },
});
