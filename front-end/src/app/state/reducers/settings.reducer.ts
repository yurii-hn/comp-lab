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

export enum Theme {
    Light = 'light',
    Dark = 'dark',
    System = 'system',
}

export enum Palette {
    Red = 'red',
    Green = 'green',
    Blue = 'blue',
    Yellow = 'yellow',
    Cyan = 'cyan',
    Magenta = 'magenta',
    Orange = 'orange',
    Chartreuse = 'chartreuse',
    SpringGreen = 'spring-green',
    Azure = 'azure',
    Violet = 'violet',
    Rose = 'rose',
}

export interface AppSettings {
    theme: Theme;
    palette: Palette;
}

export interface DashboardSettings {
    yAxisRangeMode: PlotYAxisRangeMode;
}

export interface SettingsState {
    app: AppSettings;
    dashboard: DashboardSettings;
}

export const settingsFeatureKey = 'settings';

const initialState: SettingsState = {
    app: {
        theme: Theme.System,
        palette: Palette.Cyan,
    },
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
