import { createReducer, on } from '@ngrx/store';
import { LocalStorageActions } from 'src/app/state/actions/local-storage.actions';
import { SettingsActions } from 'src/app/state/actions/settings.actions';

interface LoadSettingsProps {
    state: SettingsState;
}

interface UpdateSettingsProps {
    settings: SettingsState;
}

export enum PlotYAxisRangeMode {
    Normal = 'normal',
    ToZero = 'tozero',
}

export interface DashboardSettings {
    yAxisRangeMode: PlotYAxisRangeMode;
}

export interface SettingsState {
    dashboard: DashboardSettings;
}

export const settingsFeatureKey = 'settings';

const initialState: SettingsState = {
    dashboard: {
        yAxisRangeMode: PlotYAxisRangeMode.Normal,
    },
};

export const settingsReducer = createReducer<SettingsState>(
    initialState,
    on(
        LocalStorageActions.loadSettings,
        (_: SettingsState, { state }: LoadSettingsProps): SettingsState => ({
            ...state,
        })
    ),
    on(
        SettingsActions.setSettings,
        (
            _: SettingsState,
            { settings }: UpdateSettingsProps
        ): SettingsState => ({ ...settings })
    )
);
