import { Values } from './common.types';

export interface InterventionParameters {
    nodesAmount: number;
    approximationType: ApproximationType;
    lowerBoundary: number;
    upperBoundary: number;
}

export interface OptimalControlParameters {
    time: number;
    nodesAmount: number;
    objectiveFunction: string;
    intervention: InterventionParameters;
}

export interface OptimalControlResult {
    compartments: Values[];
    interventions: Values[];
    approximatedInterventions: Values[];
    noControlObjective: number;
    optimalObjective: number;
}

export enum ApproximationType {
    PiecewiseConstant = 'piecewise-constant',
    PiecewiseLinear = 'piecewise-linear',
}
