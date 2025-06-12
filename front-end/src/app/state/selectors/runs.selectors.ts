import { Data, ProcessingType } from '@core/types/processing';
import { Result, Run } from '@core/types/run.types';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { runsFeatureKey, RunsState } from 'src/app/state/reducers/runs.reducer';

export const selectRunsState = createFeatureSelector<RunsState>(runsFeatureKey);

export const selectCurrentRun = createSelector(
    selectRunsState,
    (state: RunsState): Run | null =>
        state.runs.find(
            (run: Run): boolean => run.name === state.selectedRunName
        ) ?? null
);

export const selectRunNames = createSelector(
    selectRunsState,
    (state: RunsState): string[] =>
        state.runs.map((run: Run): string => run.name)
);

export const selectIsRunsEmpty = createSelector(
    selectRunsState,
    (state: RunsState): boolean => !state.runs.length
);

export const selectCurrentRunName = createSelector(
    selectRunsState,
    (state: RunsState): string | null => state.selectedRunName
);

export const selectCurrentRunData = createSelector(
    selectCurrentRun,
    (run: Run | null): Result | null => run && run.data
);

export const selectCurrentRunValues = createSelector(
    selectCurrentRun,
    (run: Run | null): Record<string, Data> => {
        if (!run) {
            return {};
        }

        switch (run.data.type) {
            case ProcessingType.Simulation:
                return run.data.result.compartments;

            case ProcessingType.OptimalControl:
                return {
                    ...run.data.result[1].compartments,
                    ...run.data.result[1].interventions,
                };

            case ProcessingType.PI:
                return run.data.result.approximation;

            default:
                throw new Error('Unknown processing type');
        }
    }
);
