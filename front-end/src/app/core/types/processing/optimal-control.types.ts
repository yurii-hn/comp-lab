import { Data } from '@core/types/processing/common.types';

export interface InterventionBoundaries {
    upperBoundary: number;
    lowerBoundary: number;
}

export interface InterventionParameters {
    nodesAmount: number;
    approximationType: ApproximationType;
    boundaries: Record<string, InterventionBoundaries>;
}

export interface OptimalControlParameters {
    time: number;
    nodesAmount: number;
    objectiveFunction: string;
    intervention: InterventionParameters;
}

export interface OptimalControlResult {
    compartments: Record<string, Data>;
    interventions: Record<string, Data>;
    noControlObjective: number;
    optimalObjective: number;
}

export enum ApproximationType {
    PiecewiseConstant = 'piecewise-constant',
    PiecewiseLinear = 'piecewise-linear',
}
