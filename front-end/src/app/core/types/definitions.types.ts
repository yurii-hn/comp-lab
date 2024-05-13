import { ICompartment, IConstant, IFlow, IIntervention } from './model.types';
import { ISelectedConstant } from './processing';

export type CompartmentDefinition = Omit<ICompartment, 'id'>;

export type ConstantDefinition = Omit<IConstant, 'id'>;

export type InterventionDefinition = Omit<IIntervention, 'id'>;

export type FlowDefinition = Omit<IFlow, 'id' | 'equation'>;

export type SelectedConstantDefinition = Omit<ISelectedConstant, 'id'>;
