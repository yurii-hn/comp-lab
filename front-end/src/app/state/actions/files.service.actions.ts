import { Model } from '@core/types/model.types';
import { Result } from '@core/types/run.types';
import { createActionGroup, emptyProps, props } from '@ngrx/store';

interface AddRunProps {
    data: Result;
    set: boolean;
}

interface ReplaceModelProps {
    model: Model;
}

interface ImportSampleModelProps {
    model: Model;
    select: boolean;
}

export const FilesServiceActions = createActionGroup({
    source: 'Files Service',
    events: {
        'Run Import Success': props<AddRunProps>(),
        'Run Data Export Success': emptyProps(),
        'Run Values Export Success': emptyProps(),

        'Model Import Success': props<ReplaceModelProps>(),
        'Sample Model Import Success': props<ImportSampleModelProps>(),
        'Model Export Success': emptyProps(),
    },
});
