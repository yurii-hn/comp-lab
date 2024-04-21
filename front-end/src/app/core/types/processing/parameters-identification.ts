import {
    IConstant,
    IModel,
    IModelWithInterventions,
    isConstant,
    isModel,
    isModelWithInterventions,
} from '../model';
import {
    IErrorResponseData,
    IRequestData,
    IResponseData,
    ISuccessResponseData,
    isErrorResponseData,
    isRequestData,
    isResponseData,
} from './common';
import {
    IOptimalControlResponsePayloadData,
    isInterventionResponseData
} from './optimal-control';
import {
    ICompartmentResponseData,
    ISimulationResponsePayload,
    isCompartmentResponseData,
    isSimulationResponsePayload,
} from './simulation';

export interface IPISelectedConstant extends IConstant {
    upperBoundary: number;
    lowerBoundary: number;
}

export function isPISelectedConstant(
    piSelectedConstant: any
): piSelectedConstant is IPISelectedConstant {
    const isKeysAmountValid: boolean =
        Object.keys(piSelectedConstant).length === 4;
    const isNameValid: boolean =
        'name' in piSelectedConstant &&
        typeof piSelectedConstant.name === 'string';
    const isValueValid: boolean =
        'value' in piSelectedConstant &&
        typeof piSelectedConstant.value === 'number';
    const isUpperBoundaryValid: boolean =
        'upperBoundary' in piSelectedConstant &&
        typeof piSelectedConstant.upperBoundary === 'number';
    const isLowerBoundaryValid: boolean =
        'lowerBoundary' in piSelectedConstant &&
        typeof piSelectedConstant.lowerBoundary === 'number';

    return (
        isKeysAmountValid &&
        isNameValid &&
        isValueValid &&
        isUpperBoundaryValid &&
        isLowerBoundaryValid
    );
}

export interface IPIParameters {
    selectedConstants: IPISelectedConstant[];
    timeStep: number;
}

export function isPIParameters(
    piParameters: any
): piParameters is IPIParameters {
    const isKeysAmountValid: boolean = Object.keys(piParameters).length === 2;
    const isSelectedConstantsValid: boolean =
        'selectedConstants' in piParameters &&
        Array.isArray(piParameters.selectedConstants) &&
        piParameters.selectedConstants.every((selectedConstant: any): boolean =>
            isPISelectedConstant(selectedConstant)
        );
    const isTimeStepValid: boolean =
        'timeStep' in piParameters && typeof piParameters.timeStep === 'number';

    return isKeysAmountValid && isSelectedConstantsValid && isTimeStepValid;
}

export type ISolutionData = IResponseData;

export function isSolutionData(
    solutionData: any
): solutionData is ISolutionData {
    return isResponseData(solutionData);
}

export type ISolutionWithoutInterventions = ISimulationResponsePayload;

export function isSolutionWithoutInterventions(
    solutionWithoutInterventions: any
): solutionWithoutInterventions is ISolutionWithoutInterventions {
    return isSimulationResponsePayload(solutionWithoutInterventions);
}

export type ISolutionWithInterventions = Omit<
    IOptimalControlResponsePayloadData,
    'approximatedInterventions'
>;

export function isSolutionWithInterventions(
    solutionWithInterventions: any
): solutionWithInterventions is ISolutionWithInterventions {
    const isKeysAmountValid: boolean =
        Object.keys(solutionWithInterventions).length === 2;
    const isCompartmentsValid: boolean =
        'compartments' in solutionWithInterventions &&
        Array.isArray(solutionWithInterventions.compartments) &&
        solutionWithInterventions.compartments.every(
            (compartment: any): boolean =>
                isCompartmentResponseData(compartment)
        );
    const isInterventionsValid: boolean =
        'interventions' in solutionWithInterventions &&
        Array.isArray(solutionWithInterventions.interventions) &&
        solutionWithInterventions.interventions.every(
            (intervention: any): boolean =>
                isInterventionResponseData(intervention)
        );

    return isKeysAmountValid && isCompartmentsValid && isInterventionsValid;
}

export type ISolution =
    | ISolutionWithoutInterventions
    | ISolutionWithInterventions;

export function isSolution(solution: any): solution is ISolution {
    return (
        isSolutionWithoutInterventions(solution) ||
        isSolutionWithInterventions(solution)
    );
}

export type IApproximatedSolution = ICompartmentResponseData[];

export function isApproximatedSolution(
    approximatedSolution: any
): approximatedSolution is IApproximatedSolution {
    return (
        Array.isArray(approximatedSolution) &&
        approximatedSolution.every((compartment: any): boolean =>
            isCompartmentResponseData(compartment)
        )
    );
}

export interface IPIRequestPayloadWithoutInterventions {
    solution: ISolutionWithoutInterventions;
    model: IModel;
}

export function isPIRequestPayloadWithoutInterventions(
    piRequestPayloadWithoutInterventions: any
): piRequestPayloadWithoutInterventions is IPIRequestPayloadWithoutInterventions {
    const isKeysAmountValid: boolean =
        Object.keys(piRequestPayloadWithoutInterventions).length === 2;
    const isSolutionValid: boolean =
        'solution' in piRequestPayloadWithoutInterventions &&
        isSolutionWithoutInterventions(
            piRequestPayloadWithoutInterventions.solution
        );
    const isModelValid: boolean =
        'model' in piRequestPayloadWithoutInterventions &&
        isModel(piRequestPayloadWithoutInterventions.model);

    return isKeysAmountValid && isSolutionValid && isModelValid;
}

export interface IPIRequestPayloadWithInterventions {
    solution: ISolutionWithInterventions;
    model: IModelWithInterventions;
}

export function isPIRequestPayloadWithInterventions(
    piRequestPayloadWithInterventions: any
): piRequestPayloadWithInterventions is IPIRequestPayloadWithInterventions {
    const isKeysAmountValid: boolean =
        Object.keys(piRequestPayloadWithInterventions).length === 2;
    const isSolutionValid: boolean =
        'solution' in piRequestPayloadWithInterventions &&
        isSolutionWithInterventions(piRequestPayloadWithInterventions.solution);
    const isModelValid: boolean =
        'model' in piRequestPayloadWithInterventions &&
        isModelWithInterventions(piRequestPayloadWithInterventions.model);

    return isKeysAmountValid && isSolutionValid && isModelValid;
}

export type IPIRequestDataWithoutInterventions = IRequestData<
    IPIParameters,
    IPIRequestPayloadWithoutInterventions
>;

export function isPIRequestDataWithoutInterventions(
    piRequestDataWithoutInterventions: any
): piRequestDataWithoutInterventions is IPIRequestDataWithoutInterventions {
    const isRequestDataValid: boolean = isRequestData(
        piRequestDataWithoutInterventions
    );
    const isParametersValid: boolean = isPIParameters(
        piRequestDataWithoutInterventions.parameters
    );
    const isPayloadValid: boolean = isPIRequestPayloadWithoutInterventions(
        piRequestDataWithoutInterventions.payload
    );

    return isRequestDataValid && isParametersValid && isPayloadValid;
}

export type IPIRequestDataWithInterventions = IRequestData<
    IPIParameters,
    IPIRequestPayloadWithInterventions
>;

export function isPIRequestDataWithInterventions(
    piRequestDataWithInterventions: any
): piRequestDataWithInterventions is IPIRequestDataWithInterventions {
    const isRequestDataValid: boolean = isRequestData(
        piRequestDataWithInterventions
    );
    const isParametersValid: boolean = isPIParameters(
        piRequestDataWithInterventions.parameters
    );
    const isPayloadValid: boolean = isPIRequestPayloadWithInterventions(
        piRequestDataWithInterventions.payload
    );

    return isRequestDataValid && isParametersValid && isPayloadValid;
}

export type IPIRequestData =
    | IPIRequestDataWithoutInterventions
    | IPIRequestDataWithInterventions;

export function isPIRequestData(
    piRequestData: any
): piRequestData is IPIRequestData {
    return (
        isPIRequestDataWithoutInterventions(piRequestData) ||
        isPIRequestDataWithInterventions(piRequestData)
    );
}

export interface IPIResponsePayloadWithoutInterventions {
    constants: IConstant[];
    solution: ISolutionWithoutInterventions;
    approximatedSolution: IApproximatedSolution;
}

export function isPIResponsePayloadWithoutInterventions(
    piResponsePayloadWithoutInterventions: any
): piResponsePayloadWithoutInterventions is IPIResponsePayloadWithoutInterventions {
    const isKeysAmountValid: boolean =
        Object.keys(piResponsePayloadWithoutInterventions).length === 3;
    const isConstantsValid: boolean =
        'constants' in piResponsePayloadWithoutInterventions &&
        Array.isArray(piResponsePayloadWithoutInterventions.constants) &&
        piResponsePayloadWithoutInterventions.constants.every(
            (constant: any): boolean => isConstant(constant)
        );
    const isSolutionValid: boolean =
        'solution' in piResponsePayloadWithoutInterventions &&
        isSolutionWithoutInterventions(
            piResponsePayloadWithoutInterventions.solution
        );
    const isApproximatedSolutionValid: boolean =
        'approximatedSolution' in piResponsePayloadWithoutInterventions &&
        isApproximatedSolution(
            piResponsePayloadWithoutInterventions.approximatedSolution
        );

    return (
        isKeysAmountValid &&
        isConstantsValid &&
        isSolutionValid &&
        isApproximatedSolutionValid
    );
}

export interface IPIResponsePayloadWithInterventions {
    constants: IConstant[];
    solution: ISolutionWithInterventions;
    approximatedSolution: IApproximatedSolution;
}

export function isPIResponsePayloadWithInterventions(
    piResponsePayloadWithInterventions: any
): piResponsePayloadWithInterventions is IPIResponsePayloadWithInterventions {
    const isKeysAmountValid: boolean =
        Object.keys(piResponsePayloadWithInterventions).length === 3;
    const isConstantsValid: boolean =
        'constants' in piResponsePayloadWithInterventions &&
        Array.isArray(piResponsePayloadWithInterventions.constants) &&
        piResponsePayloadWithInterventions.constants.every(
            (constant: any): boolean => isConstant(constant)
        );
    const isSolutionValid: boolean =
        'solution' in piResponsePayloadWithInterventions &&
        isSolutionWithInterventions(
            piResponsePayloadWithInterventions.solution
        );
    const isApproximatedSolutionValid: boolean =
        'approximatedSolution' in piResponsePayloadWithInterventions &&
        isApproximatedSolution(
            piResponsePayloadWithInterventions.approximatedSolution
        );

    return (
        isKeysAmountValid &&
        isConstantsValid &&
        isSolutionValid &&
        isApproximatedSolutionValid
    );
}

export type IPIResponsePayload =
    | IPIResponsePayloadWithoutInterventions
    | IPIResponsePayloadWithInterventions;

export function isPIResponsePayload(
    piResponsePayload: any
): piResponsePayload is IPIResponsePayload {
    return (
        isPIResponsePayloadWithoutInterventions(piResponsePayload) ||
        isPIResponsePayloadWithInterventions(piResponsePayload)
    );
}

export type IPISuccessResponseData = ISuccessResponseData<
    IPIParameters,
    IPIResponsePayload
>;

export function isPISuccessResponseData(
    piSuccessResponseData: any
): piSuccessResponseData is IPISuccessResponseData {
    const isSuccessResponseDataValid: boolean = isResponseData(
        piSuccessResponseData
    );
    const isParametersValid: boolean = isPIParameters(
        piSuccessResponseData.parameters
    );
    const isPayloadValid: boolean = isPIResponsePayload(
        piSuccessResponseData.payload
    );

    return isSuccessResponseDataValid && isParametersValid && isPayloadValid;
}

export type IPIErrorResponseData = IErrorResponseData;

export function isPIErrorResponseData(
    piErrorResponseData: any
): piErrorResponseData is IPIErrorResponseData {
    return isErrorResponseData(piErrorResponseData);
}

export type IPIResponseData = IPISuccessResponseData | IPIErrorResponseData;

export function isPIResponseData(
    piResponseData: any
): piResponseData is IPIResponseData {
    return (
        isPISuccessResponseData(piResponseData) ||
        isPIErrorResponseData(piResponseData)
    );
}
