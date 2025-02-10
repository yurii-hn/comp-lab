import { Data, Run } from '@core/types/run.types';
import { createReducer, on } from '@ngrx/store';
import { DashboardActions } from 'src/app/state/actions/dashboard.actions';
import { FilesServiceActions } from 'src/app/state/actions/files.service.actions';
import { ProcessingServiceActions } from 'src/app/state/actions/processing.service.actions';

interface AddRunProps {
    data: Data;
    set: boolean;
}

interface SelectRunProps {
    name: string;
}

export interface RunsState {
    runs: Run[];
    selectedRunName: string | null;
}

export const runsFeatureKey = 'runs';

const initialState: RunsState = {
    runs: [],
    selectedRunName: null,
};

export const runsReducer = createReducer<RunsState>(
    initialState,
    on(
        ProcessingServiceActions.modelProcessingSuccess,
        FilesServiceActions.runImportSuccess,
        (state: RunsState, { data, set }: AddRunProps): RunsState => {
            const newRun: Run = {
                name: `Run ${state.runs.length + 1}`,
                data,
            } as Run;

            return {
                ...state,
                runs: [...state.runs, newRun],
                selectedRunName:
                    set || state.runs.length === 0
                        ? newRun.name
                        : state.selectedRunName,
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
        const newSelectedRunName: string =
            state.runs[Math.max(currentRunIndex - 1, 0)].name;

        return {
            ...state,
            runs: [
                ...state.runs.slice(0, currentRunIndex),
                ...state.runs.slice(currentRunIndex + 1).map(
                    (run: Run, index: number): Run => ({
                        ...run,
                        name: `Run ${currentRunIndex + index + 1}`,
                    }),
                ),
            ],
            selectedRunName: newSelectedRunName,
        };
    }),
);
