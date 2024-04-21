import {
    ICompartmentBase,
    IConstant,
    IFlow,
    IIntervention,
    isCompartmentBase,
    isConstant,
    isFlow,
    isIntervention,
} from './model';

export interface IModelConfig {
    compartments: ICompartmentBase[];
    constants: IConstant[];
    interventions: IIntervention[];
    flows: IFlow[];
}

export function isModelConfig(modelConfig: any): modelConfig is IModelConfig {
    const isKeysAmountValid: boolean = Object.keys(modelConfig).length === 4;
    const isCompartmentsValid: boolean =
        'compartments' in modelConfig &&
        Array.isArray(modelConfig.compartments) &&
        modelConfig.compartments.every((compartment: any): boolean =>
            isCompartmentBase(compartment)
        );
    const isConstantsValid: boolean =
        'constants' in modelConfig &&
        Array.isArray(modelConfig.constants) &&
        modelConfig.constants.every((constant: any): boolean =>
            isConstant(constant)
        );
    const isInterventionsValid: boolean =
        'interventions' in modelConfig &&
        Array.isArray(modelConfig.interventions) &&
        modelConfig.interventions.every((intervention: any): boolean =>
            isIntervention(intervention)
        );
    const isFlowsValid: boolean =
        'flows' in modelConfig &&
        Array.isArray(modelConfig.flows) &&
        modelConfig.flows.every((flow: any): boolean => isFlow(flow));

    return (
        isKeysAmountValid &&
        isCompartmentsValid &&
        isConstantsValid &&
        isInterventionsValid &&
        isFlowsValid
    );
}

export type IImportModel = IModelConfig;

export function isImportModel(model: any): model is IImportModel {
    return isModelConfig(model);
}

export type IExportModel = IModelConfig;

export function isExportModel(model: any): model is IExportModel {
    return isModelConfig(model);
}

export interface IWorkspaceBase {
    model: IModelConfig;
}

export function isWorkspaceBase(
    workspaceBase: any
): workspaceBase is IWorkspaceBase {
    const isKeysAmountValid: boolean = Object.keys(workspaceBase).length === 1;
    const isModelValid: boolean =
        'model' in workspaceBase && isModelConfig(workspaceBase.model);

    return isKeysAmountValid && isModelValid;
}

export interface IWorkspace extends IWorkspaceBase {
    name: string;
}

export function isWorkspace(workspace: any): workspace is IWorkspace {
    const isKeysAmountValid: boolean = Object.keys(workspace).length === 2;
    const isNameValid: boolean =
        'name' in workspace && typeof workspace.name === 'string';
    const isModelValid: boolean =
        'model' in workspace && isModelConfig(workspace.model);

    return isKeysAmountValid && isNameValid && isModelValid;
}
