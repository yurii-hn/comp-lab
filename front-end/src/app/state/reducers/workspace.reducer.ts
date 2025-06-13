import {
  Compartment,
  Constant,
  Flow,
  Intervention,
  Model,
} from '@core/types/model.types';
import { Diff, getDiff } from '@core/utils';
import { createReducer, on } from '@ngrx/store';
import { AppActions } from 'src/app/state/actions/app.actions';
import { EditCompartmentActions } from 'src/app/state/actions/compartment.actions';
import { DashboardActions } from 'src/app/state/actions/dashboard.actions';
import { DefinitionsTableActions } from 'src/app/state/actions/definitions-table.actions';
import { FilesServiceActions } from 'src/app/state/actions/files.service.actions';
import { EditFlowActions } from 'src/app/state/actions/flow.actions';
import { LocalStorageActions } from 'src/app/state/actions/local-storage.actions';
import { WorkspaceActions } from 'src/app/state/actions/workspace.actions';

interface LoadWorkspacesProps {
    state: WorkspacesState;
}

interface AddWorkspaceProps {
    model?: Model;
}

interface RenameWorkspaceProps {
    name: string;
}

interface SelectWorkspaceProps {
    name: string;
}

interface ReplaceModelProps {
    model: Model;
}

interface ImportSampleModelProps {
    model: Model;
    select: boolean;
}

interface UpdateDefinitionsProps {
    definitions: Omit<Model, 'flows'>;
}

interface ClearModelProps {
    constants: boolean;
}

interface UpsertModelCompartmentProps {
    compartment: Compartment;
}

interface RemoveModelCompartmentProps {
    id: string;
}

interface UpsertModelFlowProps {
    flow: Flow;
}

interface RemoveModelFlowProps {
    id: string;
}

export interface Workspace {
    name: string;
    model: Model;
}

export interface WorkspacesState {
    workspaces: Workspace[];
    selectedWorkspaceName: string;
    _nextEntityId: number;
}

export const workspacesFeatureKey = 'workspaces';

const initialState: WorkspacesState = {
    workspaces: [
        {
            name: 'Workspace 1',
            model: {
                compartments: [],
                constants: [],
                interventions: [],
                flows: [],
            },
        },
    ],
    selectedWorkspaceName: 'Workspace 1',
    _nextEntityId: 2,
};

export const workspacesReducer = createReducer<WorkspacesState>(
    initialState,
    on(
        LocalStorageActions.loadWorkspaces,
        (
            _: WorkspacesState,
            { state }: LoadWorkspacesProps,
        ): WorkspacesState => ({
            ...state,
        }),
    ),
    on(
        WorkspaceActions.addWorkspace,
        AppActions.addWorkspace,
        DashboardActions.extractModel,
        (
            state: WorkspacesState,
            { model }: AddWorkspaceProps,
        ): WorkspacesState => {
            const newWorkspace: Workspace = {
                name: `Workspace ${state._nextEntityId}`,
                model: model ?? {
                    compartments: [],
                    constants: [],
                    interventions: [],
                    flows: [],
                },
            };

            return {
                ...state,
                workspaces: [...state.workspaces, newWorkspace],
                selectedWorkspaceName: newWorkspace.name,
                _nextEntityId: state._nextEntityId + 1,
            };
        },
    ),
    on(
        WorkspaceActions.renameWorkspace,
        (
            state: WorkspacesState,
            { name }: RenameWorkspaceProps,
        ): WorkspacesState => {
            const currentWorkspaceIndex: number = state.workspaces.findIndex(
                (workspace: Workspace): boolean =>
                    workspace.name === state.selectedWorkspaceName,
            );
            const currentWorkspace: Workspace =
                state.workspaces[currentWorkspaceIndex];

            return {
                ...state,
                workspaces: [
                    ...state.workspaces.slice(0, currentWorkspaceIndex),
                    {
                        ...currentWorkspace,
                        name,
                    },
                    ...state.workspaces.slice(currentWorkspaceIndex + 1),
                ],
                selectedWorkspaceName: name,
            };
        },
    ),
    on(
        WorkspaceActions.selectWorkspace,
        (
            state: WorkspacesState,
            { name }: SelectWorkspaceProps,
        ): WorkspacesState => {
            const workspace: Workspace | undefined = state.workspaces.find(
                (workspace: Workspace): boolean => workspace.name === name,
            );

            if (!workspace) {
                return state;
            }

            return {
                ...state,
                selectedWorkspaceName: name,
            };
        },
    ),
    on(
        FilesServiceActions.modelImportSuccess,
        (
            state: WorkspacesState,
            { model }: ReplaceModelProps,
        ): WorkspacesState => {
            const currentWorkspaceIndex: number = state.workspaces.findIndex(
                (workspace: Workspace): boolean =>
                    workspace.name === state.selectedWorkspaceName,
            );
            const currentWorkspace: Workspace =
                state.workspaces[currentWorkspaceIndex];

            return {
                ...state,
                workspaces: [
                    ...state.workspaces.slice(0, currentWorkspaceIndex),
                    {
                        ...currentWorkspace,
                        model,
                    },
                    ...state.workspaces.slice(currentWorkspaceIndex + 1),
                ],
            };
        },
    ),
    on(
        FilesServiceActions.sampleModelImportSuccess,
        (
            state: WorkspacesState,
            { model, select }: ImportSampleModelProps,
        ): WorkspacesState => {
            const currentWorkspaceIndex: number = state.workspaces.findIndex(
                (workspace: Workspace): boolean =>
                    workspace.name === state.selectedWorkspaceName,
            );
            const currentWorkspace: Workspace =
                state.workspaces[currentWorkspaceIndex];

            const isWorkspaceEmpty: boolean =
                currentWorkspace.model.compartments.length === 0 &&
                currentWorkspace.model.constants.length === 0 &&
                currentWorkspace.model.flows.length === 0 &&
                currentWorkspace.model.interventions.length === 0;

            if (!isWorkspaceEmpty) {
                const newWorkspace: Workspace = {
                    name: `Workspace ${state._nextEntityId}`,
                    model,
                };

                return {
                    workspaces: [...state.workspaces, newWorkspace],
                    selectedWorkspaceName: select
                        ? newWorkspace.name
                        : state.selectedWorkspaceName,
                    _nextEntityId: state._nextEntityId + 1,
                };
            }

            return {
                ...state,
                workspaces: [
                    ...state.workspaces.slice(0, currentWorkspaceIndex),
                    {
                        ...currentWorkspace,
                        model,
                    },
                    ...state.workspaces.slice(currentWorkspaceIndex + 1),
                ],
            };
        },
    ),
    on(
        DefinitionsTableActions.updateDefinitions,
        (
            state: WorkspacesState,
            { definitions }: UpdateDefinitionsProps,
        ): WorkspacesState => {
            interface DiffDefinitionsPair<
                DefinitionType extends {
                    id: string;
                    name: string;
                },
            > {
                diff: Diff<DefinitionType>;
                definitions: DefinitionType[];
            }

            const currentWorkspaceIndex: number = state.workspaces.findIndex(
                (workspace: Workspace): boolean =>
                    workspace.name === state.selectedWorkspaceName,
            );
            const currentWorkspace: Workspace =
                state.workspaces[currentWorkspaceIndex];

            const compartmentsDiff: Diff<Compartment> = getDiff(
                currentWorkspace.model.compartments,
                definitions.compartments,
            );
            const constantsDiff: Diff<Constant> = getDiff(
                currentWorkspace.model.constants,
                definitions.constants,
            );
            const interventionsDiff: Diff<Intervention> = getDiff(
                currentWorkspace.model.interventions,
                definitions.interventions,
            );

            const flowsWithDiffsApplied = [
                {
                    diff: compartmentsDiff,
                    definitions: currentWorkspace.model.compartments,
                },
                {
                    diff: constantsDiff,
                    definitions: currentWorkspace.model.constants,
                },
                {
                    diff: interventionsDiff,
                    definitions: currentWorkspace.model.interventions,
                },
            ].reduce(
                (
                    flows: Flow[],
                    {
                        diff,
                        definitions,
                    }: DiffDefinitionsPair<
                        Compartment | Constant | Intervention
                    >,
                ): Flow[] =>
                    applyDefinitionsDiffToFlows(flows, diff, definitions),
                currentWorkspace.model.flows,
            );

            return {
                ...state,
                workspaces: [
                    ...state.workspaces.slice(0, currentWorkspaceIndex),
                    {
                        ...currentWorkspace,
                        model: {
                            ...currentWorkspace.model,
                            ...definitions,
                            flows: flowsWithDiffsApplied,
                        },
                    },
                    ...state.workspaces.slice(currentWorkspaceIndex + 1),
                ],
            };
        },
    ),
    on(
        WorkspaceActions.removeWorkspace,
        (state: WorkspacesState): WorkspacesState => {
            if (state.workspaces.length < 2) {
                return state;
            }

            const currentWorkspaceIndex: number = state.workspaces.findIndex(
                (workspace: Workspace): boolean =>
                    workspace.name === state.selectedWorkspaceName,
            );
            const newSelectedWorkspaceName: string =
                state.workspaces[
                    currentWorkspaceIndex === 0
                        ? 1
                        : Math.max(currentWorkspaceIndex - 1, 0)
                ].name;

            return {
                ...state,
                workspaces: [
                    ...state.workspaces.slice(0, currentWorkspaceIndex),
                    ...state.workspaces.slice(currentWorkspaceIndex + 1),
                ],
                selectedWorkspaceName: newSelectedWorkspaceName,
            };
        },
    ),
    on(
        AppActions.clearModel,
        (
            state: WorkspacesState,
            { constants }: ClearModelProps,
        ): WorkspacesState => {
            const currentWorkspaceIndex: number = state.workspaces.findIndex(
                (workspace: Workspace): boolean =>
                    workspace.name === state.selectedWorkspaceName,
            );
            const currentWorkspace: Workspace =
                state.workspaces[currentWorkspaceIndex];

            return {
                ...state,
                workspaces: [
                    ...state.workspaces.slice(0, currentWorkspaceIndex),
                    {
                        ...currentWorkspace,
                        model: {
                            compartments: [],
                            constants: constants
                                ? []
                                : currentWorkspace.model.constants,
                            interventions: [],
                            flows: [],
                        },
                    },
                    ...state.workspaces.slice(currentWorkspaceIndex + 1),
                ],
            };
        },
    ),
    on(
        EditCompartmentActions.upsertCompartment,
        (
            state: WorkspacesState,
            { compartment }: UpsertModelCompartmentProps,
        ): WorkspacesState => {
            const currentWorkspaceIndex: number = state.workspaces.findIndex(
                (workspace: Workspace): boolean =>
                    workspace.name === state.selectedWorkspaceName,
            );
            const currentWorkspace: Workspace =
                state.workspaces[currentWorkspaceIndex];

            const existingCompartment: Compartment | undefined =
                currentWorkspace.model.compartments.find(
                    (currentCompartment: Compartment): boolean =>
                        currentCompartment.id === compartment.id,
                );

            if (!existingCompartment) {
                return {
                    ...state,
                    workspaces: [
                        ...state.workspaces.slice(0, currentWorkspaceIndex),
                        {
                            ...currentWorkspace,
                            model: {
                                ...currentWorkspace.model,
                                compartments: [
                                    ...currentWorkspace.model.compartments,
                                    compartment,
                                ],
                            },
                        },
                        ...state.workspaces.slice(currentWorkspaceIndex + 1),
                    ],
                };
            }

            return {
                ...state,
                workspaces: [
                    ...state.workspaces.slice(0, currentWorkspaceIndex),
                    {
                        ...currentWorkspace,
                        model: {
                            ...currentWorkspace.model,
                            compartments:
                                currentWorkspace.model.compartments.map(
                                    (
                                        currentCompartment: Compartment,
                                    ): Compartment =>
                                        currentCompartment.id === compartment.id
                                            ? compartment
                                            : currentCompartment,
                                ),
                            flows: renameDefinitionInFlows(
                                currentWorkspace.model.flows,
                                existingCompartment.name,
                                compartment.name,
                            ),
                        },
                    },
                    ...state.workspaces.slice(currentWorkspaceIndex + 1),
                ],
            };
        },
    ),
    on(
        AppActions.removeCompartment,
        (
            state: WorkspacesState,
            { id }: RemoveModelCompartmentProps,
        ): WorkspacesState => {
            const currentWorkspaceIndex: number = state.workspaces.findIndex(
                (workspace: Workspace): boolean =>
                    workspace.name === state.selectedWorkspaceName,
            );
            const currentWorkspace: Workspace =
                state.workspaces[currentWorkspaceIndex];

            const compartment: Compartment | undefined =
                currentWorkspace.model.compartments.find(
                    (compartment: Compartment): boolean =>
                        compartment.id === id,
                );

            if (!compartment) {
                return state;
            }

            return {
                ...state,
                workspaces: [
                    ...state.workspaces.slice(0, currentWorkspaceIndex),
                    {
                        ...currentWorkspace,
                        model: {
                            ...currentWorkspace.model,
                            compartments:
                                currentWorkspace.model.compartments.filter(
                                    (compartment: Compartment): boolean =>
                                        compartment.id !== id,
                                ),
                            flows: renameDefinitionInFlows(
                                currentWorkspace.model.flows.filter(
                                    (flow: Flow): boolean =>
                                        flow.source !== id &&
                                        flow.target !== id,
                                ),
                                compartment.name,
                                removedDefinitionPlaceholder,
                            ),
                        },
                    },
                    ...state.workspaces.slice(currentWorkspaceIndex + 1),
                ],
            };
        },
    ),
    on(
        EditFlowActions.upsertFlow,
        (
            state: WorkspacesState,
            { flow }: UpsertModelFlowProps,
        ): WorkspacesState => {
            const currentWorkspaceIndex: number = state.workspaces.findIndex(
                (workspace: Workspace): boolean =>
                    workspace.name === state.selectedWorkspaceName,
            );
            const currentWorkspace: Workspace =
                state.workspaces[currentWorkspaceIndex];

            const existingFlow: Flow | undefined =
                currentWorkspace.model.flows.find(
                    (currentFlow: Flow): boolean => currentFlow.id === flow.id,
                );

            if (!existingFlow) {
                return {
                    ...state,
                    workspaces: [
                        ...state.workspaces.slice(0, currentWorkspaceIndex),
                        {
                            ...currentWorkspace,
                            model: {
                                ...currentWorkspace.model,
                                flows: [...currentWorkspace.model.flows, flow],
                            },
                        },
                        ...state.workspaces.slice(currentWorkspaceIndex + 1),
                    ],
                };
            }

            return {
                ...state,
                workspaces: [
                    ...state.workspaces.slice(0, currentWorkspaceIndex),
                    {
                        ...currentWorkspace,
                        model: {
                            ...currentWorkspace.model,
                            flows: currentWorkspace.model.flows.map(
                                (currentFlow: Flow): Flow =>
                                    currentFlow.id === flow.id
                                        ? flow
                                        : currentFlow,
                            ),
                        },
                    },
                    ...state.workspaces.slice(currentWorkspaceIndex + 1),
                ],
            };
        },
    ),
    on(
        AppActions.removeFlow,
        (
            state: WorkspacesState,
            { id }: RemoveModelFlowProps,
        ): WorkspacesState => {
            const currentWorkspaceIndex: number = state.workspaces.findIndex(
                (workspace: Workspace): boolean =>
                    workspace.name === state.selectedWorkspaceName,
            );
            const currentWorkspace: Workspace =
                state.workspaces[currentWorkspaceIndex];

            const flow: Flow | undefined = currentWorkspace.model.flows.find(
                (flow: Flow): boolean => flow.id === id,
            );

            if (!flow) {
                return state;
            }

            return {
                ...state,
                workspaces: [
                    ...state.workspaces.slice(0, currentWorkspaceIndex),
                    {
                        ...currentWorkspace,
                        model: {
                            ...currentWorkspace.model,
                            flows: currentWorkspace.model.flows.filter(
                                (flow: Flow): boolean => flow.id !== id,
                            ),
                        },
                    },
                    ...state.workspaces.slice(currentWorkspaceIndex + 1),
                ],
            };
        },
    ),
);

const removedDefinitionPlaceholder: string = '_REMOVED_DEFINITION_';

function applyDefinitionsDiffToFlows<
    DefinitionType extends {
        id: string;
        name: string;
    },
>(
    flows: Flow[],
    diff: Diff<DefinitionType>,
    currentDefinitions: DefinitionType[],
): Flow[] {
    const flowsWithUpdatedDefinitions: Flow[] = diff.updated.reduce(
        (updatedFlows: Flow[], definition: DefinitionType): Flow[] =>
            renameDefinitionInFlows(
                updatedFlows,
                currentDefinitions.find(
                    (currentDefinition: DefinitionType): boolean =>
                        currentDefinition.id === definition.id,
                )!.name,
                definition.name,
            ),
        flows,
    );
    const flowsWithoutRemovedDefinitions: Flow[] = diff.removed.reduce(
        (updatedFlows: Flow[], definition: DefinitionType): Flow[] =>
            renameDefinitionInFlows(
                updatedFlows,
                definition.name,
                removedDefinitionPlaceholder,
            ),
        flowsWithUpdatedDefinitions,
    );

    return flowsWithoutRemovedDefinitions;
}

function renameDefinitionInFlows(
    flows: Flow[],
    name: string,
    newName: string,
): Flow[] {
    const expressionRegExp: RegExp = new RegExp(`\\b${name}\\b`, 'g');

    return flows.map(
        (flow: Flow): Flow => ({
            ...flow,
            equation: flow.equation.replace(expressionRegExp, newName),
        }),
    );
}
