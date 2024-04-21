import { IModelWithInterventions, isModelWithInterventions } from '../model';
import {
    IErrorResponseData,
    IRequestData,
    IResponseData,
    ISuccessResponseData,
    isErrorResponseData,
    isRequestData,
    isResponseData,
    isSuccessResponseData,
} from './common';
import {
    ICompartmentResponseData,
    ISimulationParameters,
    ISimulationResponsePayload,
    isCompartmentResponseData,
    isSimulationResponsePayload,
} from './simulation';

export type IInterventionResponseData = IResponseData;

export function isInterventionResponseData(
    interventionResponseData: any
): interventionResponseData is IInterventionResponseData {
    return isResponseData(interventionResponseData);
}

export interface IOptimalControlParameters extends ISimulationParameters {
    costFunction: string;
    interventionNodesAmount: number;
    interventionUpperBoundary: number;
    interventionLowerBoundary: number;
    interventionApproximationType: InterventionApproximationType;
}

export function isOptimalControlParameters(
    optimalControlParameters: any
): optimalControlParameters is IOptimalControlParameters {
    const isKeysAmountValid: boolean =
        Object.keys(optimalControlParameters).length === 7;
    const isTimeValid: boolean =
        'time' in optimalControlParameters &&
        typeof optimalControlParameters.time === 'number';
    const isNodesAmountValid: boolean =
        'nodesAmount' in optimalControlParameters &&
        typeof optimalControlParameters.nodesAmount === 'number';
    const isCostFunctionValid: boolean =
        'costFunction' in optimalControlParameters &&
        typeof optimalControlParameters.costFunction === 'string';
    const isInterventionNodesAmountValid: boolean =
        'interventionNodesAmount' in optimalControlParameters &&
        typeof optimalControlParameters.interventionNodesAmount === 'number';
    const isInterventionUpperBoundaryValid: boolean =
        'interventionUpperBoundary' in optimalControlParameters &&
        typeof optimalControlParameters.interventionUpperBoundary === 'number';
    const isInterventionLowerBoundaryValid: boolean =
        'interventionLowerBoundary' in optimalControlParameters &&
        typeof optimalControlParameters.interventionLowerBoundary === 'number';
    const isInterventionApproximationTypeValid: boolean =
        'interventionApproximationType' in optimalControlParameters &&
        isInterventionApproximationType(
            optimalControlParameters.interventionApproximationType
        );

    return (
        isKeysAmountValid &&
        isTimeValid &&
        isNodesAmountValid &&
        isCostFunctionValid &&
        isInterventionNodesAmountValid &&
        isInterventionUpperBoundaryValid &&
        isInterventionLowerBoundaryValid &&
        isInterventionApproximationTypeValid
    );
}

export type IOptimalControlRequestPayload = IModelWithInterventions;

export function isOptimalControlRequestPayload(
    optimalControlRequestPayload: any
): optimalControlRequestPayload is IOptimalControlRequestPayload {
    return isModelWithInterventions(optimalControlRequestPayload);
}

export type IOptimalControlRequestData = IRequestData<
    IOptimalControlParameters,
    IOptimalControlRequestPayload
>;

export function isOptimalControlRequestData(
    optimalControlRequestData: any
): optimalControlRequestData is IOptimalControlRequestData {
    const isRequestDataValid: boolean = isRequestData(
        optimalControlRequestData
    );
    const isParametersValid: boolean = isOptimalControlParameters(
        optimalControlRequestData.parameters
    );
    const isPayloadValid: boolean = isOptimalControlRequestPayload(
        optimalControlRequestData.payload
    );

    return isRequestDataValid && isParametersValid && isPayloadValid;
}

export interface IOptimalControlResponsePayloadData {
    compartments: ICompartmentResponseData[];
    approximatedInterventions: IInterventionResponseData[];
    interventions: IInterventionResponseData[];
}

export function isOptimalControlResponsePayloadData(
    optimalControlResponsePayload: any
): optimalControlResponsePayload is IOptimalControlResponsePayloadData {
    const isKeysAmountValid: boolean =
        Object.keys(optimalControlResponsePayload).length === 3;
    const isCompartmentsValid: boolean =
        'compartments' in optimalControlResponsePayload &&
        Array.isArray(optimalControlResponsePayload.compartments) &&
        optimalControlResponsePayload.compartments.every(
            (compartment: any): boolean =>
                isCompartmentResponseData(compartment)
        );
    const isApproximatedInterventionsValid: boolean =
        'approximatedInterventions' in optimalControlResponsePayload &&
        Array.isArray(
            optimalControlResponsePayload.approximatedInterventions
        ) &&
        optimalControlResponsePayload.approximatedInterventions.every(
            (intervention: any): boolean =>
                isInterventionResponseData(intervention)
        );
    const isInterventionsValid: boolean =
        'interventions' in optimalControlResponsePayload &&
        Array.isArray(optimalControlResponsePayload.interventions) &&
        optimalControlResponsePayload.interventions.every(
            (intervention: any): boolean =>
                isInterventionResponseData(intervention)
        );

    return (
        isKeysAmountValid &&
        isCompartmentsValid &&
        isApproximatedInterventionsValid &&
        isInterventionsValid
    );
}

export type IOptimalControlResponsePayload = [
    ISimulationResponsePayload,
    IOptimalControlResponsePayloadData
];

export function isOptimalControlResponsePayload(
    optimalControlResponsePayload: any
): optimalControlResponsePayload is IOptimalControlResponsePayload {
    return (
        Array.isArray(optimalControlResponsePayload) &&
        optimalControlResponsePayload.length === 2 &&
        isSimulationResponsePayload(optimalControlResponsePayload[0]) &&
        isOptimalControlResponsePayloadData(optimalControlResponsePayload[1])
    );
}

export type IOptimalControlSuccessResponseData = ISuccessResponseData<
    IOptimalControlParameters,
    IOptimalControlResponsePayload
>;

export function isOptimalControlSuccessResponseData(
    optimalControlSuccessResponseData: any
): optimalControlSuccessResponseData is IOptimalControlSuccessResponseData {
    const isSuccessResponseDataValid: boolean = isSuccessResponseData(
        optimalControlSuccessResponseData
    );
    const isParametersValid: boolean = isOptimalControlParameters(
        optimalControlSuccessResponseData.parameters
    );
    const isPayloadValid: boolean = isOptimalControlResponsePayload(
        optimalControlSuccessResponseData.payload
    );

    return isSuccessResponseDataValid && isParametersValid && isPayloadValid;
}

export type IOptimalControlErrorResponseData = IErrorResponseData;

export function isOptimalControlErrorResponseData(
    optimalControlErrorResponseData: any
): optimalControlErrorResponseData is IOptimalControlErrorResponseData {
    return isErrorResponseData(optimalControlErrorResponseData);
}

export type IOptimalControlResponseData =
    | IOptimalControlSuccessResponseData
    | IOptimalControlErrorResponseData;

export function isOptimalControlResponseData(
    optimalControlResponseData: any
): optimalControlResponseData is IOptimalControlResponseData {
    return (
        isOptimalControlSuccessResponseData(optimalControlResponseData) ||
        isOptimalControlErrorResponseData(optimalControlResponseData)
    );
}

export enum InterventionApproximationType {
    PiecewiseConstant = 'piecewise-constant',
    PiecewiseLinear = 'piecewise-linear',
}

export function isInterventionApproximationType(
    interventionApproximationType: any
): interventionApproximationType is InterventionApproximationType {
    return Object.values(InterventionApproximationType).includes(
        interventionApproximationType
    );
}
