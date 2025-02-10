import { Compartment, Flow, Model } from '@core/types/model.types';
import { createReducer, on } from '@ngrx/store';
import { AppActions } from 'src/app/state/actions/app.actions';
import { CompartmentDialogActions } from 'src/app/state/actions/compartment-dialog.actions';
import { DefinitionsTableActions } from 'src/app/state/actions/definitions-table.actions';
import { FilesServiceActions } from 'src/app/state/actions/files.service.actions';
import { FlowDialogActions } from 'src/app/state/actions/flow-dialog.actions';
import { WorkspaceActions } from 'src/app/state/actions/workspace.actions';

interface AddWorkspaceProps {
    model?: Model;
}

interface SelectWorkspaceProps {
    name: string;
}

interface ReplaceModelProps {
    model: Model;
}

interface ImportSampleModelProps {
    model: Model;
    createNewWorkspace: boolean;
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
};

export const workspacesReducer = createReducer<WorkspacesState>(
    initialState,
    on(
        WorkspaceActions.addWorkspace,
        (
            state: WorkspacesState,
            { model }: AddWorkspaceProps,
        ): WorkspacesState => {
            const newWorkspace: Workspace = {
                name: `Workspace ${state.workspaces.length + 1}`,
                model: model ?? {
                    compartments: [],
                    constants: [],
                    interventions: [],
                    flows: [],
                },
            };

            return {
                workspaces: [...state.workspaces, newWorkspace],
                selectedWorkspaceName: newWorkspace.name,
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
        DefinitionsTableActions.updateModel,
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
            { model, createNewWorkspace }: ImportSampleModelProps,
        ): WorkspacesState => {
            if (createNewWorkspace) {
                const newWorkspace: Workspace = {
                    name: `Workspace ${state.workspaces.length + 1}`,
                    model,
                };

                return {
                    workspaces: [...state.workspaces, newWorkspace],
                    selectedWorkspaceName: newWorkspace.name,
                };
            }

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
                state.workspaces[Math.max(currentWorkspaceIndex - 1, 0)].name;

            return {
                ...state,
                workspaces: [
                    ...state.workspaces.slice(0, currentWorkspaceIndex),
                    ...state.workspaces.slice(currentWorkspaceIndex + 1).map(
                        (workspace: Workspace, index: number): Workspace => ({
                            ...workspace,
                            name: `Workspace ${currentWorkspaceIndex + index + 1}`,
                        }),
                    ),
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
        CompartmentDialogActions.upsertCompartment,
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
        FlowDialogActions.upsertFlow,
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

const removedDefinitionPlaceholder: string = '<REMOVED_DEFINITION>';

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
