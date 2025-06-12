import { Result, Run } from '@core/types/run.types';
import { createReducer, on } from '@ngrx/store';
import { DashboardActions } from 'src/app/state/actions/dashboard.actions';
import { FilesServiceActions } from 'src/app/state/actions/files.service.actions';
import { LocalStorageActions } from 'src/app/state/actions/local-storage.actions';
import { ProcessingServiceActions } from 'src/app/state/actions/processing.service.actions';

interface LoadRunsProps {
    state: RunsState;
}

interface AddRunProps {
    data: Result;
    set: boolean;
}

interface RenameRunProps {
    name: string;
}

interface SelectRunProps {
    name: string;
}

export interface RunsState {
    runs: Run[];
    selectedRunName: string | null;
    _nextEntityId: number;
}

export const runsFeatureKey = 'runs';

const initialState: RunsState = {
    runs: [],
    selectedRunName: null,
    _nextEntityId: 1,
};

export const runsReducer = createReducer<RunsState>(
    initialState,
    on(
        LocalStorageActions.loadRuns,
        (_: RunsState, { state }: LoadRunsProps): RunsState => ({
            ...state,
        }),
    ),
    on(
        ProcessingServiceActions.modelProcessingSuccess,
        FilesServiceActions.runImportSuccess,
        (state: RunsState, { data, set }: AddRunProps): RunsState => {
            const newRun: Run = {
                name: `Run ${state._nextEntityId}`,
                data,
            } as Run;

            return {
                ...state,
                runs: [...state.runs, newRun],
                selectedRunName:
                    set || state.runs.length === 0
                        ? newRun.name
                        : state.selectedRunName,
                _nextEntityId: state._nextEntityId + 1,
            };
        },
    ),
    on(
        DashboardActions.renameRun,
        (state: RunsState, { name }: RenameRunProps): RunsState => {
            const currentRunIndex: number = state.runs.findIndex(
                (run: Run): boolean => run.name === state.selectedRunName,
            );
            const currentRun: Run = state.runs[currentRunIndex];

            return {
                ...state,
                runs: [
                    ...state.runs.slice(0, currentRunIndex),
                    {
                        ...currentRun,
                        name,
                    },
                    ...state.runs.slice(currentRunIndex + 1),
                ],
                selectedRunName: name,
            };
        },
    ),
    on(
        DashboardActions.selectRun,
        (state: RunsState, { name }: SelectRunProps): RunsState => {
            const run: Run | undefined = state.runs.find(
                (run: Run): boolean => run.name === name,
            );

            if (!run) {
                return state;
            }

            return {
                ...state,
                selectedRunName: name,
            };
        },
    ),
    on(DashboardActions.removeRun, (state: RunsState): RunsState => {
        if (!state.runs.length || !state.selectedRunName) {
            return state;
        }

        const currentRunIndex: number = state.runs.findIndex(
            (run: Run): boolean => run.name === state.selectedRunName,
        );
        const newSelectedRunName: string | null =
            state.runs.length === 1
                ? null
                : state.runs[
                      currentRunIndex === 0
                          ? 1
                          : Math.max(currentRunIndex - 1, 0)
                  ].name;

        return {
            ...state,
            runs: [
                ...state.runs.slice(0, currentRunIndex),
                ...state.runs.slice(currentRunIndex + 1),
            ],
            selectedRunName: newSelectedRunName,
        };
    }),
);
