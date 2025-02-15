import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideEffects } from '@ngrx/effects';
import { provideState, provideStore } from '@ngrx/store';
import { AppEffects } from 'src/app/state/effects/app.effects';
import { DashboardEffects } from 'src/app/state/effects/dashboard.effects';
import { RunsEffects } from 'src/app/state/effects/runs.effects';
import { SettingsEffects } from 'src/app/state/effects/settings.effects';
import { WorkspaceEffects } from 'src/app/state/effects/workspace.effects';
import {
  runsFeatureKey,
  runsReducer,
} from 'src/app/state/reducers/runs.reducer';
import {
  settingsFeatureKey,
  settingsReducer,
} from 'src/app/state/reducers/settings.reducer';
import {
  workspacesFeatureKey,
  workspacesReducer,
} from 'src/app/state/reducers/workspace.reducer';

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideAnimationsAsync(),
        provideHttpClient(),
        provideStore(),
        provideState(settingsFeatureKey, settingsReducer),
        provideState(workspacesFeatureKey, workspacesReducer),
        provideState(runsFeatureKey, runsReducer),
        provideEffects(
            AppEffects,
            DashboardEffects,
            WorkspaceEffects,
            RunsEffects,
            SettingsEffects,
        ),
    ],
};
