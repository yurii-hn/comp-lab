import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { MAT_TOOLTIP_DEFAULT_OPTIONS } from '@angular/material/tooltip';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { KATEX, MATH_JS } from '@core/injection-tokens';
import { provideEffects } from '@ngrx/effects';
import { provideState, provideStore } from '@ngrx/store';
import * as katex from 'katex';
import * as mathjs from 'mathjs';
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
        {
            provide: MAT_TOOLTIP_DEFAULT_OPTIONS,
            useValue: {
                showDelay: 350,
                hideDelay: 0,
                touchendHideDelay: 0,
                disableTooltipInteractivity: true,
            },
        },
        {
            provide: MATH_JS,
            useValue: mathjs,
        },
        {
            provide: KATEX,
            useValue: katex,
        },
    ],
};
