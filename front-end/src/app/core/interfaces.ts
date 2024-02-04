export interface ICompartmentBase {
    name: string;
    value: number;
}

export interface ICompartment extends ICompartmentBase {
    inflows: string[];
    outflows: string[];
}

export interface IEditCompartmentPayload extends ICompartmentBase {
    previousName: string;
}

export interface IFlow {
    source: string;
    target: string;
    equation: string;
}

export interface ISimulationParameters {
    time: number;
    step: number;
}

export interface IConstant {
    name: string;
    value: number;
}

export interface IIntervention {
    name: string;
}

export interface ISimulationData {
    model: ICompartment[];
    parameters: ISimulationParameters;
}

export interface IOptimalControlData extends ISimulationData {
    interventions: IIntervention[];
    costFunction: string;
}

export interface ICompartmentSimulatedData {
    name: string;
    values: number[];
}

export interface IInterventionSimulatedData {
    name: string;
    values: number[];
}

export interface IErrorResponse {
    error: string;
    success: false;
}

export interface ISuccessResponse<PayloadType> {
    parameters: ISimulationParameters;
    payload: PayloadType;
    success: true;
}

export interface ISimulationSuccessResponsePayload {
    compartments: ICompartmentSimulatedData[];
}

export type ISimulationSuccessResponse =
    ISuccessResponse<ISimulationSuccessResponsePayload>;

export type ISimulationErrorResponse = IErrorResponse;

export type ISimulationResponse =
    | ISimulationSuccessResponse
    | ISimulationErrorResponse;

export interface IOptimalControlSuccessResponsePayload {
    compartments: ICompartmentSimulatedData[];
    interventions: IInterventionSimulatedData[];
}

export type IOptimalControlSuccessResponse = ISuccessResponse<
    [ISimulationSuccessResponsePayload, IOptimalControlSuccessResponsePayload]
>;

export type IOptimalControlErrorResponse = IErrorResponse;

export type IOptimalControlResponse =
    | IOptimalControlSuccessResponse
    | IOptimalControlErrorResponse;

export interface ISimulationResultsBase {
    data: ISimulationSuccessResponse;
}

export interface IOptimalControlResultsBase {
    data: IOptimalControlSuccessResponse;
}

export type IResultsBase = ISimulationResultsBase | IOptimalControlResultsBase;

export interface IResultsCore {
    name: string;
}

export type ISimulationResults = ISimulationResultsBase & IResultsCore;

export interface IOptimalControlResults
    extends IOptimalControlResultsBase,
        IResultsCore {
    viewMode: OptimalControlResultsViewMode;
}

export type IResults = ISimulationResults | IOptimalControlResults;

export enum OptimalControlResultsViewMode {
    NonOptimized = 'non-optimized',
    Optimized = 'optimized',
}

export enum DefinitionType {
    Compartment = 'compartment',
    Constant = 'constant',
    Intervention = 'intervention',
}

export type ICompartmentDefinition = ICompartmentBase & {
    type: DefinitionType.Compartment;
};

export type IConstantDefinition = IConstant & {
    type: DefinitionType.Constant;
};

export type IInterventionDefinition = IIntervention & {
    type: DefinitionType.Intervention;
};

export type Definition =
    | ICompartmentDefinition
    | IConstantDefinition
    | IInterventionDefinition;

export interface IDefinitionsTable {
    compartments: ICompartmentDefinition[];
    constants: IConstantDefinition[];
    interventions: IInterventionDefinition[];
}

export interface IModel {
    compartments: ICompartmentBase[];
    constants: IConstant[];
    interventions: IIntervention[];
    flows: IFlow[];
}

export type IImportModel = IModel;

export type IExportModel = IModel;

export interface IWorkspaceBase {
    model: IModel;
}

export interface IWorkspace extends IWorkspaceBase {
    name: string;
}

export interface IValidationResponse {
    isValid: boolean;
    message?: string;
}
