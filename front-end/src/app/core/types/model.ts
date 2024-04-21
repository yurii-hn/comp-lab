export interface ICompartmentBase {
    name: string;
    value: number;
}

export function isCompartmentBase(
    compartmentBase: any
): compartmentBase is ICompartmentBase {
    const isKeysAmountValid: boolean =
        Object.keys(compartmentBase).length === 2;
    const isNameValid: boolean =
        'name' in compartmentBase && typeof compartmentBase.name === 'string';
    const isValueValid: boolean =
        'value' in compartmentBase && typeof compartmentBase.value === 'number';

    return isKeysAmountValid && isNameValid && isValueValid;
}

export interface ICompartment extends ICompartmentBase {
    inflows: string[];
    outflows: string[];
}

export function isCompartment(compartment: any): compartment is ICompartment {
    const isKeysAmountValid: boolean = Object.keys(compartment).length === 4;
    const isNameValid: boolean =
        'name' in compartment && typeof compartment.name === 'string';
    const isValueValid: boolean =
        'value' in compartment && typeof compartment.value === 'number';
    const isInflowsValid: boolean =
        'inflows' in compartment &&
        Array.isArray(compartment.inflows) &&
        compartment.inflows.every(
            (inflow: any): boolean => typeof inflow === 'string'
        );
    const isOutflowsValid: boolean =
        'outflows' in compartment &&
        Array.isArray(compartment.outflows) &&
        compartment.outflows.every(
            (outflow: any): boolean => typeof outflow === 'string'
        );

    return (
        isKeysAmountValid &&
        isNameValid &&
        isValueValid &&
        isInflowsValid &&
        isOutflowsValid
    );
}

export interface IEditCompartmentPayload extends ICompartmentBase {
    previousName: string;
}

export function isEditCompartmentPayload(
    editCompartmentPayload: any
): editCompartmentPayload is IEditCompartmentPayload {
    const isKeysAmountValid: boolean =
        Object.keys(editCompartmentPayload).length === 3;
    const isNameValid: boolean =
        'name' in editCompartmentPayload &&
        typeof editCompartmentPayload.name === 'string';
    const isValueValid: boolean =
        'value' in editCompartmentPayload &&
        typeof editCompartmentPayload.value === 'number';
    const isPreviousNameValid: boolean =
        'previousName' in editCompartmentPayload &&
        typeof editCompartmentPayload.previousName === 'string';

    return (
        isKeysAmountValid && isNameValid && isValueValid && isPreviousNameValid
    );
}

export interface IConstant {
    name: string;
    value: number;
}

export function isConstant(constant: any): constant is IConstant {
    const isKeysAmountValid: boolean = Object.keys(constant).length === 2;
    const isNameValid: boolean =
        'name' in constant && typeof constant.name === 'string';
    const isValueValid: boolean =
        'value' in constant && typeof constant.value === 'number';

    return isKeysAmountValid && isNameValid && isValueValid;
}

export interface IIntervention {
    name: string;
}

export function isIntervention(
    intervention: any
): intervention is IIntervention {
    const isKeysAmountValid: boolean = Object.keys(intervention).length === 1;
    const isNameValid: boolean =
        'name' in intervention && typeof intervention.name === 'string';

    return isKeysAmountValid && isNameValid;
}

export interface IFlow {
    source: string;
    target: string;
    equation: string;
}

export function isFlow(flow: any): flow is IFlow {
    const isKeysAmountValid: boolean = Object.keys(flow).length === 3;
    const isSourceValid: boolean =
        'source' in flow && typeof flow.source === 'string';
    const isTargetValid: boolean =
        'target' in flow && typeof flow.target === 'string';
    const isEquationValid: boolean =
        'equation' in flow && typeof flow.equation === 'string';

    return (
        isKeysAmountValid && isSourceValid && isTargetValid && isEquationValid
    );
}

export interface IModel {
    compartments: ICompartment[];
    constants: IConstant[];
}

export function isModel(model: any): model is IModel {
    const isKeysAmountValid: boolean = Object.keys(model).length === 2;
    const isCompartmentsValid: boolean =
        'compartments' in model &&
        Array.isArray(model.compartments) &&
        model.compartments.every((compartment: any): boolean =>
            isCompartment(compartment)
        );
    const isConstantsValid: boolean =
        'constants' in model &&
        Array.isArray(model.constants) &&
        model.constants.every((constant: any): boolean => isConstant(constant));

    return isKeysAmountValid && isCompartmentsValid && isConstantsValid;
}

export interface IModelWithInterventions extends IModel {
    interventions: IIntervention[];
}

export function isModelWithInterventions(
    modelWithInterventions: any
): modelWithInterventions is IModelWithInterventions {
    const isKeysAmountValid: boolean =
        Object.keys(modelWithInterventions).length === 3;
    const isCompartmentsValid: boolean =
        'compartments' in modelWithInterventions &&
        Array.isArray(modelWithInterventions.compartments) &&
        modelWithInterventions.compartments.every((compartment: any): boolean =>
            isCompartment(compartment)
        );
    const isConstantsValid: boolean =
        'constants' in modelWithInterventions &&
        Array.isArray(modelWithInterventions.constants) &&
        modelWithInterventions.constants.every((constant: any): boolean =>
            isConstant(constant)
        );
    const isInterventionsValid: boolean =
        'interventions' in modelWithInterventions &&
        Array.isArray(modelWithInterventions.interventions) &&
        modelWithInterventions.interventions.every(
            (intervention: any): boolean => isIntervention(intervention)
        );

    return (
        isKeysAmountValid &&
        isCompartmentsValid &&
        isConstantsValid &&
        isInterventionsValid
    );
}
