import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideEffects } from '@ngrx/effects';
import { provideState, provideStore } from '@ngrx/store';
import { AppEffects } from 'src/app/state/effects/app.effects';
import { DashboardEffects } from 'src/app/state/effects/dashboard.effects';
import {
  runsFeatureKey,
  runsReducer,
} from 'src/app/state/reducers/runs.reducer';
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
        provideState(runsFeatureKey, runsReducer),
        provideState(workspacesFeatureKey, workspacesReducer),
        provideEffects(AppEffects, DashboardEffects),
    ],
};
