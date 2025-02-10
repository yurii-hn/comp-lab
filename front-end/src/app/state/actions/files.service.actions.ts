import { Model } from '@core/types/model.types';
import { Data } from '@core/types/run.types';
import { createActionGroup, emptyProps, props } from '@ngrx/store';

interface AddRunProps {
    data: Data;
    set: boolean;
}

interface ReplaceModelProps {
    model: Model;
}

interface ImportSampleModelProps {
    model: Model;
    createNewWorkspace: boolean;
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
