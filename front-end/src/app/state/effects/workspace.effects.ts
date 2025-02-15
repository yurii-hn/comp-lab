import { inject, Injectable } from '@angular/core';
import { LocalStorageKey } from '@core/types/system.types';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { skipUntil, tap } from 'rxjs';
import { AppActions } from 'src/app/state/actions/app.actions';
import { LocalStorageActions } from 'src/app/state/actions/local-storage.actions';
import { WorkspacesState } from 'src/app/state/reducers/workspace.reducer';
import { selectWorkspacesState } from 'src/app/state/selectors/workspace.selectors';

@Injectable()
export class WorkspaceEffects {
    private readonly store: Store = inject(Store);

    private readonly actions$: Actions = inject(Actions);

    private readonly localStorageSync$ = createEffect(
        () =>
            this.store.select(selectWorkspacesState).pipe(
                skipUntil(this.actions$.pipe(ofType(AppActions.syncInit))),
                tap((workspacesState: WorkspacesState): void =>
                    localStorage.setItem(
                        LocalStorageKey.Workspaces,
                        JSON.stringify(workspacesState),
                    ),
                ),
            ),
        {
            dispatch: false,
        },
    );

    private readonly loadWorkspaces$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(AppActions.loadWorkspacesFromLocalStorage),
                tap((): void => {
                    const stateString: string | null = localStorage.getItem(
                        LocalStorageKey.Workspaces,
                    );

                    if (!stateString) {
                        return;
                    }

                    const state: WorkspacesState = JSON.parse(stateString);

                    this.store.dispatch(
                        LocalStorageActions.loadWorkspaces({
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
