import { inject, Injectable } from '@angular/core';
import { LocalStorageKey } from '@core/types/system.types';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { skipUntil, tap } from 'rxjs';
import { AppActions } from 'src/app/state/actions/app.actions';
import { LocalStorageActions } from 'src/app/state/actions/local-storage.actions';
import { SettingsState } from 'src/app/state/reducers/settings.reducer';
import { selectSettingsState } from 'src/app/state/selectors/settings.selectors';

@Injectable()
export class SettingsEffects {
    private readonly store: Store = inject(Store);

    private readonly actions$: Actions = inject(Actions);

    private readonly localStorageSync$ = createEffect(
        () =>
            this.store.select(selectSettingsState).pipe(
                skipUntil(this.actions$.pipe(ofType(AppActions.syncInit))),
                tap((settingsState: SettingsState): void =>
                    localStorage.setItem(
                        LocalStorageKey.Settings,
                        JSON.stringify(settingsState),
                    ),
                ),
            ),
        {
            dispatch: false,
        },
    );

    private readonly loadSettings$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(AppActions.loadSettingsFromLocalStorage),
                tap((): void => {
                    const stateString: string | null = localStorage.getItem(
                        LocalStorageKey.Settings,
                    );

                    if (!stateString) {
                        return;
                    }

                    const state: SettingsState = JSON.parse(stateString);

                    this.store.dispatch(
                        LocalStorageActions.loadSettings({
                            state,
                        }),
                    );
                }),
            ),
        {
            dispatch: false,
        },
    );
}
