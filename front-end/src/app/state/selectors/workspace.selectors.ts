import {
  Compartment,
  Constant,
  Intervention,
  Model,
} from '@core/types/model.types';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import {
  Workspace,
  workspacesFeatureKey,
  WorkspacesState,
} from 'src/app/state/reducers/workspace.reducer';

export const selectWorkspacesState =
    createFeatureSelector<WorkspacesState>(workspacesFeatureKey);

export const selectCurrentWorkspace = createSelector(
    selectWorkspacesState,
    (state: WorkspacesState): Workspace =>
        state.workspaces.find(
            (workspace: Workspace): boolean =>
                workspace.name === state.selectedWorkspaceName,
        ) as Workspace,
);

export const selectWorkspaceNames = createSelector(
    selectWorkspacesState,
    (state: WorkspacesState): string[] =>
        state.workspaces.map((workspace: Workspace): string => workspace.name),
);

export const selectWorkspacesCount = createSelector(
    selectWorkspacesState,
    (state: WorkspacesState): number => state.workspaces.length,
);

export const selectCurrentWorkspaceName = createSelector(
    selectWorkspacesState,
    (state: WorkspacesState): string => state.selectedWorkspaceName,
);

export const selectCurrentModel = createSelector(
    selectCurrentWorkspace,
    (workspace: Workspace): Model => workspace.model,
);

export const selectCompartments = createSelector(
    selectCurrentModel,
    (state: Model): Compartment[] => state.compartments,
);

export const selectHasCompartments = createSelector(
    selectCompartments,
    (compartments: Compartment[]): boolean => !!compartments.length,
);

export const selectConstants = createSelector(
    selectCurrentModel,
    (state: Model): Constant[] => state.constants,
);

export const selectInterventions = createSelector(
    selectCurrentModel,
    (state: Model): Intervention[] => state.interventions,
);

export const selectSymbols = createSelector(
    selectCurrentModel,
    (state: Model): string[] => [
        ...state.compartments.map(
            (compartment: Compartment): string => compartment.name,
        ),
        ...state.constants.map((constant: Constant): string => constant.name),
        ...state.interventions.map(
            (intervention: Intervention): string => intervention.name,
        ),
    ],
);
