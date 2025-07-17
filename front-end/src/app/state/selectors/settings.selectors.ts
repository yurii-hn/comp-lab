import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  AppSettings,
  DashboardSettings,
  settingsFeatureKey,
  SettingsState,
} from 'src/app/state/reducers/settings.reducer';

export const selectSettingsState =
    createFeatureSelector<SettingsState>(settingsFeatureKey);

export const selectAppSettings = createSelector(
    selectSettingsState,
    (state: SettingsState): AppSettings => state.app
);

export const selectDashboardSettings = createSelector(
    selectSettingsState,
    (state: SettingsState): DashboardSettings => state.dashboard
);
