import { inject, Injectable } from '@angular/core';
import { LocalStorageKey } from '@core/types/system.types';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { skipUntil, tap } from 'rxjs';
import { AppActions } from 'src/app/state/actions/app.actions';
import { LocalStorageActions } from 'src/app/state/actions/local-storage.actions';
import { RunsState } from 'src/app/state/reducers/runs.reducer';
import { selectRunsState } from 'src/app/state/selectors/runs.selectors';

@Injectable()
export class RunsEffects {
    private readonly store: Store = inject(Store);

    private readonly actions$: Actions = inject(Actions);

    private readonly localStorageSync$ = createEffect(
        () =>
            this.store.select(selectRunsState).pipe(
                skipUntil(this.actions$.pipe(ofType(AppActions.syncInit))),
                tap((runsState: RunsState): void =>
                    localStorage.setItem(
                        LocalStorageKey.Runs,
                        JSON.stringify(runsState),
                    ),
                ),
            ),
        {
            dispatch: false,
        },
    );

    private readonly loadRuns$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(AppActions.loadRunsFromLocalStorage),
                tap((): void => {
                    const stateString: string | null = localStorage.getItem(
                        LocalStorageKey.Runs,
                    );

                    if (!stateString) {
                        return;
                    }

                    const state: RunsState = JSON.parse(stateString);

                    this.store.dispatch(
                        LocalStorageActions.loadRuns({
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
