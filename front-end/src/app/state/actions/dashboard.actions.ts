import { createActionGroup, emptyProps, props } from '@ngrx/store';

interface SelectRunProps {
    name: string;
}

export const DashboardActions = createActionGroup({
    source: 'Dashboard Component',
    events: {
        'Add Run': emptyProps(),
        'Select Run': props<SelectRunProps>(),
        'Remove Run': emptyProps(),
        'Export Run Data': emptyProps(),
        'Export Run Values': emptyProps(),
    },
});
