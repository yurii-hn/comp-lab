import {
    IOptimalControlParameters,
    isOptimalControlParameters,
} from './optimal-control';
import {
    IPIParameters,
    ISolution,
    isPIParameters,
    isSolution,
} from './parameters-identification';
import { ISimulationParameters, isSimulationParameters } from './simulation';

export interface IProcessingDialogSimulationValue {
    parameters: ISimulationParameters;
}

export function isProcessingDialogSimulationValue(
    processingDialogSimulationValue: any
): processingDialogSimulationValue is IProcessingDialogSimulationValue {
    const isKeysAmountValid: boolean =
        Object.keys(processingDialogSimulationValue).length === 1;
    const isParametersValid: boolean =
        'parameters' in processingDialogSimulationValue &&
        isSimulationParameters(processingDialogSimulationValue.parameters);

    return isKeysAmountValid && isParametersValid;
}

export interface IProcessingDialogOptimalControlValue {
    parameters: IOptimalControlParameters;
}

export function isProcessingDialogOptimalControlValue(
    processingDialogOptimalControlValue: any
): processingDialogOptimalControlValue is IProcessingDialogOptimalControlValue {
    const isKeysAmountValid: boolean =
        Object.keys(processingDialogOptimalControlValue).length === 1;
    const isParametersValid: boolean =
        'parameters' in processingDialogOptimalControlValue &&
        isOptimalControlParameters(
            processingDialogOptimalControlValue.parameters
        );

    return isKeysAmountValid && isParametersValid;
}

export interface IProcessingDialogPIValue {
    parameters: IPIParameters;
    solution: ISolution;
}

export function isProcessingDialogPIValue(
    processingDialogPIValue: any
): processingDialogPIValue is IProcessingDialogPIValue {
    const isKeysAmountValid: boolean =
        Object.keys(processingDialogPIValue).length === 2;
    const isParametersValid: boolean =
        'parameters' in processingDialogPIValue &&
        isPIParameters(processingDialogPIValue.parameters);
    const isSolutionValid: boolean =
        'solution' in processingDialogPIValue &&
        isSolution(processingDialogPIValue.solution);

    return isKeysAmountValid && isParametersValid && isSolutionValid;
}

export type IProcessingDialogValue =
    | IProcessingDialogSimulationValue
    | IProcessingDialogOptimalControlValue
    | IProcessingDialogPIValue
    | null;

export function isProcessingDialogValue(
    processingDialogValue: any
): processingDialogValue is IProcessingDialogValue {
    return (
        processingDialogValue === null ||
        isProcessingDialogSimulationValue(processingDialogValue) ||
        isProcessingDialogOptimalControlValue(processingDialogValue) ||
        isProcessingDialogPIValue(processingDialogValue)
    );
}

export enum ProcessingType {
    Simulation = 0,
    OptimalControl = 1,
    ParametersIdentification = 2,
}

export function isProcessingType(
    processingType: any
): processingType is ProcessingType {
    return Object.values(ProcessingType).includes(processingType);
}
