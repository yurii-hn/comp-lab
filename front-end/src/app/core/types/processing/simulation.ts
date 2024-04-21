import { IModel, isModel } from '../model';
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

export type ICompartmentResponseData = IResponseData;

export function isCompartmentResponseData(
    compartmentResponseData: any
): compartmentResponseData is ICompartmentResponseData {
    return isResponseData(compartmentResponseData);
}

export interface ISimulationParameters {
    time: number;
    nodesAmount: number;
}

export function isSimulationParameters(
    simulationParameters: any
): simulationParameters is ISimulationParameters {
    const isKeysAmountValid: boolean =
        Object.keys(simulationParameters).length === 2;
    const isTimeValid: boolean =
        'time' in simulationParameters &&
        typeof simulationParameters.time === 'number';
    const isNodesAmountValid: boolean =
        'nodesAmount' in simulationParameters &&
        typeof simulationParameters.nodesAmount === 'number';

    return isKeysAmountValid && isTimeValid && isNodesAmountValid;
}

export type ISimulationRequestPayload = IModel;

export function isSimulationRequestPayload(
    simulationRequestPayload: any
): simulationRequestPayload is ISimulationRequestPayload {
    return isModel(simulationRequestPayload);
}

export type ISimulationRequestData = IRequestData<
    ISimulationParameters,
    ISimulationRequestPayload
>;

export function isSimulationRequestData(
    simulationRequestData: any
): simulationRequestData is ISimulationRequestData {
    const isRequestDataValid: boolean = isRequestData(simulationRequestData);
    const isParametersValid: boolean = isSimulationParameters(
        simulationRequestData.parameters
    );
    const isPayloadValid: boolean = isSimulationRequestPayload(
        simulationRequestData.payload
    );

    return isRequestDataValid && isParametersValid && isPayloadValid;
}

export interface ISimulationResponsePayload {
    compartments: ICompartmentResponseData[];
}

export function isSimulationResponsePayload(
    simulationResponsePayload: any
): simulationResponsePayload is ISimulationResponsePayload {
    const isKeysAmountValid: boolean =
        Object.keys(simulationResponsePayload).length === 1;
    const isCompartmentsValid: boolean =
        'compartments' in simulationResponsePayload &&
        Array.isArray(simulationResponsePayload.compartments) &&
        simulationResponsePayload.compartments.every(
            (compartment: any): boolean =>
                isCompartmentResponseData(compartment)
        );

    return isKeysAmountValid && isCompartmentsValid;
}

export type ISimulationSuccessResponseData = ISuccessResponseData<
    ISimulationParameters,
    ISimulationResponsePayload
>;

export function isSimulationSuccessResponseData(
    simulationSuccessResponseData: any
): simulationSuccessResponseData is ISimulationSuccessResponseData {
    const isSuccessResponseDataValid: boolean = isSuccessResponseData(
        simulationSuccessResponseData
    );
    const isParametersValid: boolean = isSimulationParameters(
        simulationSuccessResponseData.parameters
    );
    const isPayloadValid: boolean = isSimulationResponsePayload(
        simulationSuccessResponseData.payload
    );

    return isSuccessResponseDataValid && isParametersValid && isPayloadValid;
}

export type ISimulationErrorResponseData = IErrorResponseData;

export function isSimulationErrorResponseData(
    simulationErrorResponseData: any
): simulationErrorResponseData is ISimulationErrorResponseData {
    return isErrorResponseData(simulationErrorResponseData);
}

export type ISimulationResponseData =
    | ISimulationSuccessResponseData
    | ISimulationErrorResponseData;

export function isSimulationResponseData(
    simulationResponseData: any
): simulationResponseData is ISimulationResponseData {
    return (
        isSimulationSuccessResponseData(simulationResponseData) ||
        isSimulationErrorResponseData(simulationResponseData)
    );
}
