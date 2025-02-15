import { createActionGroup, props } from '@ngrx/store';
import { SettingsState } from 'src/app/state/reducers/settings.reducer';

interface UpdateSettingsProps {
    settings: SettingsState;
}

export const SettingsActions = createActionGroup({
    source: 'Settings Component',
    events: {
        'Set Settings': props<UpdateSettingsProps>(),
    },
});
