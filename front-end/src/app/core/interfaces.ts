export interface ICompartmentBase {
    name: string;
    value: number;
}

export interface ICompartment extends ICompartmentBase {
    inflows: string[];
    outflows: string[];
}

export interface IConstant {
    name: string;
    value: number;
}

export interface IIntervention {
    name: string;
}

export interface IFlow {
    source: string;
    target: string;
    equation: string;
}

export interface IEditCompartmentPayload extends ICompartmentBase {
    previousName: string;
}

export interface IParameters {
    time: number;
    nodesAmount: number;
}

export type ISimulationParameters = IParameters;

export enum InterventionApproximationType {
    PiecewiseConstant = 'piecewise-constant',
    PiecewiseLinear = 'piecewise-linear',
}

export interface IOptimalControlParameters extends IParameters {
    costFunction: string;
    interventionNodesAmount: number;
    interventionUpperBoundary: number;
    interventionLowerBoundary: number;
    interventionApproximationType: InterventionApproximationType;
}

export interface IRequestData<ParametersType, PayloadType> {
    parameters: ParametersType;
    payload: PayloadType;
}

export interface ISimulationRequestPayload {
    compartments: ICompartment[];
}

export type ISimulationRequestData = IRequestData<
    ISimulationParameters,
    ISimulationRequestPayload
>;

export interface IOptimalControlRequestPayload {
    compartments: ICompartment[];
    interventions: IIntervention[];
}

export type IOptimalControlRequestData = IRequestData<
    IOptimalControlParameters,
    IOptimalControlRequestPayload
>;

export interface IResponseData {
    name: string;
    values: number[];
}

export type ICompartmentResponseData = IResponseData;

export type IInterventionResponseData = IResponseData;

export interface IErrorResponseData {
    error: string;
    success: false;
}

export interface ISuccessResponseData<ParametersType, PayloadType> {
    parameters: ParametersType;
    payload: PayloadType;
    success: true;
}

export interface ISimulationResponsePayload {
    compartments: ICompartmentResponseData[];
}

export type ISimulationSuccessResponseData = ISuccessResponseData<
    ISimulationParameters,
    ISimulationResponsePayload
>;

export type ISimulationErrorResponseData = IErrorResponseData;

export type ISimulationResponseData =
    | ISimulationSuccessResponseData
    | ISimulationErrorResponseData;

export interface IOptimalControlResponsePayload {
    compartments: ICompartmentResponseData[];
    interventions: IInterventionResponseData[];
}

export type IOptimalControlSuccessResponseData = ISuccessResponseData<
    IOptimalControlParameters,
    [ISimulationResponsePayload, IOptimalControlResponsePayload]
>;

export type IOptimalControlErrorResponseData = IErrorResponseData;

export type IOptimalControlResponseData =
    | IOptimalControlSuccessResponseData
    | IOptimalControlErrorResponseData;

export interface IValidationResponse {
    isValid: boolean;
    message?: string;
}

export interface ISimulationResultsBase {
    data: ISimulationSuccessResponseData;
}

export interface IOptimalControlResultsBase {
    data: IOptimalControlSuccessResponseData;
}

export type IResultsBase = ISimulationResultsBase | IOptimalControlResultsBase;

export interface IResultsCore {
    name: string;
}

export type ISimulationResults = ISimulationResultsBase & IResultsCore;

export type IOptimalControlResults = IOptimalControlResultsBase &
    IResultsCore & {
        viewMode: OptimalControlResultsViewMode;
    };

export type IResults = ISimulationResults | IOptimalControlResults;

export enum OptimalControlResultsViewMode {
    NonOptimized = 'non-optimized',
    Optimized = 'optimized',
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

export type IDefinition =
    | ICompartmentDefinition
    | IConstantDefinition
    | IInterventionDefinition;

export interface IDefinitionsTable {
    compartments: ICompartmentDefinition[];
    constants: IConstantDefinition[];
    interventions: IInterventionDefinition[];
}

export enum DefinitionType {
    Compartment = 'compartment',
    Constant = 'constant',
    Intervention = 'intervention',
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
