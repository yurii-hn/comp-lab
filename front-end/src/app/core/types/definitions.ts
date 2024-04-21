import {
    ICompartmentBase,
    IConstant,
    IIntervention
} from './model';

export type ICompartmentDefinition = ICompartmentBase & {
    type: DefinitionType.Compartment;
};

export function isCompartmentDefinition(
    compartmentDefinition: any
): compartmentDefinition is ICompartmentDefinition {
    const isKeysAmountValid: boolean =
        Object.keys(compartmentDefinition).length === 3;
    const isNameValid: boolean =
        'name' in compartmentDefinition &&
        typeof compartmentDefinition.name === 'string';
    const isValueValid: boolean =
        'value' in compartmentDefinition &&
        typeof compartmentDefinition.value === 'number';
    const isTypeValid: boolean =
        'type' in compartmentDefinition &&
        compartmentDefinition.type === DefinitionType.Compartment;

    return isKeysAmountValid && isNameValid && isValueValid && isTypeValid;
}

export type IConstantDefinition = IConstant & {
    type: DefinitionType.Constant;
};

export function isConstantDefinition(
    constantDefinition: any
): constantDefinition is IConstantDefinition {
    const isKeysAmountValid: boolean =
        Object.keys(constantDefinition).length === 3;
    const isNameValid: boolean =
        'name' in constantDefinition &&
        typeof constantDefinition.name === 'string';
    const isValueValid: boolean =
        'value' in constantDefinition &&
        typeof constantDefinition.value === 'number';
    const isTypeValid: boolean =
        'type' in constantDefinition &&
        constantDefinition.type === DefinitionType.Constant;

    return isKeysAmountValid && isNameValid && isValueValid && isTypeValid;
}

export type IInterventionDefinition = IIntervention & {
    type: DefinitionType.Intervention;
};

export function isInterventionDefinition(
    interventionDefinition: any
): interventionDefinition is IInterventionDefinition {
    const isKeysAmountValid: boolean =
        Object.keys(interventionDefinition).length === 2;
    const isNameValid: boolean =
        'name' in interventionDefinition &&
        typeof interventionDefinition.name === 'string';
    const isTypeValid: boolean =
        'type' in interventionDefinition &&
        interventionDefinition.type === DefinitionType.Intervention;

    return isKeysAmountValid && isNameValid && isTypeValid;
}

export type IDefinition =
    | ICompartmentDefinition
    | IConstantDefinition
    | IInterventionDefinition;

export function isDefinition(definition: any): definition is IDefinition {
    return (
        isCompartmentDefinition(definition) ||
        isConstantDefinition(definition) ||
        isInterventionDefinition(definition)
    );
}

export interface IDefinitionsTable {
    compartments: ICompartmentDefinition[];
    constants: IConstantDefinition[];
    interventions: IInterventionDefinition[];
}

export function isDefinitionsTable(
    definitionsTable: any
): definitionsTable is IDefinitionsTable {
    const isKeysAmountValid: boolean =
        Object.keys(definitionsTable).length === 3;
    const isCompartmentsValid: boolean =
        'compartments' in definitionsTable &&
        Array.isArray(definitionsTable.compartments) &&
        definitionsTable.compartments.every((compartment: any): boolean =>
            isCompartmentDefinition(compartment)
        );
    const isConstantsValid: boolean =
        'constants' in definitionsTable &&
        Array.isArray(definitionsTable.constants) &&
        definitionsTable.constants.every((constant: any): boolean =>
            isConstantDefinition(constant)
        );
    const isInterventionsValid: boolean =
        'interventions' in definitionsTable &&
        Array.isArray(definitionsTable.interventions) &&
        definitionsTable.interventions.every((intervention: any): boolean =>
            isInterventionDefinition(intervention)
        );

    return (
        isKeysAmountValid &&
        isCompartmentsValid &&
        isConstantsValid &&
        isInterventionsValid
    );
}

export enum DefinitionType {
    Compartment = 'compartment',
    Constant = 'constant',
    Intervention = 'intervention',
}

export function isDefinitionType(
    definitionType: any
): definitionType is DefinitionType {
    return Object.values(DefinitionType).includes(definitionType);
}
