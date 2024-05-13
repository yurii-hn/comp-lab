import {
    CompartmentDefinition,
    ConstantDefinition,
    FlowDefinition,
    InterventionDefinition,
    SelectedConstantDefinition,
} from './definitions.types';

export function isCompartmentDefinition(
    compartmentDefinition: any
): compartmentDefinition is CompartmentDefinition {
    const isKeysAmountValid: boolean =
        Object.keys(compartmentDefinition).length === 2;

    const isNameValid: boolean =
        'name' in compartmentDefinition &&
        typeof compartmentDefinition.name === 'string';
    const isValueValid: boolean =
        'value' in compartmentDefinition &&
        typeof compartmentDefinition.value === 'number';

    return isKeysAmountValid && isNameValid && isValueValid;
}

export function isConstantDefinition(
    constantDefinition: any
): constantDefinition is ConstantDefinition {
    const isKeysAmountValid: boolean =
        Object.keys(constantDefinition).length === 2;

    const isNameValid: boolean =
        'name' in constantDefinition &&
        typeof constantDefinition.name === 'string';
    const isValueValid: boolean =
        'value' in constantDefinition &&
        typeof constantDefinition.value === 'number';

    return isKeysAmountValid && isNameValid && isValueValid;
}

export function isInterventionDefinition(
    interventionDefinition: any
): interventionDefinition is InterventionDefinition {
    const isKeysAmountValid: boolean =
        Object.keys(interventionDefinition).length === 1;

    const isNameValid: boolean =
        'name' in interventionDefinition &&
        typeof interventionDefinition.name === 'string';

    return isKeysAmountValid && isNameValid;
}

export function isFlowDefinition(
    flowDefinition: any
): flowDefinition is FlowDefinition {
    const isKeysAmountValid: boolean = Object.keys(flowDefinition).length === 2;

    const isSourceValid: boolean =
        'source' in flowDefinition && typeof flowDefinition.source === 'string';
    const isTargetValid: boolean =
        'target' in flowDefinition && typeof flowDefinition.target === 'string';

    return isKeysAmountValid && isSourceValid && isTargetValid;
}

export function isSelectedConstantDefinition(
    selectedConstantDefinition: any
): selectedConstantDefinition is SelectedConstantDefinition {
    const isKeysAmountValid: boolean =
        Object.keys(selectedConstantDefinition).length === 4;

    const isNameValid: boolean =
        'name' in selectedConstantDefinition &&
        typeof selectedConstantDefinition.name === 'string';
    const isUpperBoundaryValid: boolean =
        'upperBoundary' in selectedConstantDefinition &&
        typeof selectedConstantDefinition.upperBoundary === 'number';
    const isValueValid: boolean =
        'value' in selectedConstantDefinition &&
        typeof selectedConstantDefinition.value === 'number';
    const isLowerBoundaryValid: boolean =
        'lowerBoundary' in selectedConstantDefinition &&
        typeof selectedConstantDefinition.lowerBoundary === 'number';

    return (
        isKeysAmountValid &&
        isNameValid &&
        isUpperBoundaryValid &&
        isValueValid &&
        isLowerBoundaryValid
    );
}
