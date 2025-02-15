import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  DashboardSettings,
  settingsFeatureKey,
  SettingsState,
} from 'src/app/state/reducers/settings.reducer';

export const selectSettingsState =
    createFeatureSelector<SettingsState>(settingsFeatureKey);

export const selectDashboardSettings = createSelector(
    selectSettingsState,
    (state: SettingsState): DashboardSettings => state.dashboard,
);
