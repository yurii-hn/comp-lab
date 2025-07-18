import { Data } from '@core/types/processing/common.types';

export interface InterventionBoundaries {
    upperBoundary: number;
    lowerBoundary: number;
}

export interface InterventionParameters {
    nodesAmount: number;
    interpolationType: InterpolationType;
    boundaries: Record<string, InterventionBoundaries>;
}

export interface OptimalControlParameters {
    time: number;
    nodesAmount: number;
    objectiveFunction: string;
    intervention: InterventionParameters;
}

export interface OptimalControlResult {
    noControlCompartments: Record<string, Data>;
    optimalCompartments: Record<string, Data>;
    interventions: Record<string, Data>;
    hamiltonian: string;
    adjointModel: Record<string, string>;
    noControlObjective: number;
    optimalObjective: number;
}

export enum InterpolationType {
    PiecewiseConstant = 'piecewise-constant',
    PiecewiseLinear = 'piecewise-linear',
}
