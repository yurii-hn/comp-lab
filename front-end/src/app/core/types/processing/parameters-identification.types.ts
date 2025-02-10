import { Values } from './common.types';

export interface SelectedConstant {
    id: string;
    name: string;
    upperBoundary: number;
    value: number;
    lowerBoundary: number;
}

export interface IdentifiedConstant {
    id: string;
    name: string;
    value: number;
}

export interface PIParameters {
    nodesAmount: number;
    selectedConstants: SelectedConstant[];
    data: Values[];
}

export interface PIResult {
    constants: IdentifiedConstant[];
    approximation: Values[];
}
