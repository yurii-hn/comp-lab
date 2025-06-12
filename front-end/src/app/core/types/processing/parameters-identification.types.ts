import { Data } from '@core/types/processing/common.types';

export interface SelectedConstant {
    upperBoundary: number;
    value: number;
    lowerBoundary: number;
}

export interface PIParameters {
    nodesAmount: number;
    forecastTime: number;
    selectedConstants: Record<string, SelectedConstant>;
    data: Record<string, Data>;
}

export interface PIResult {
    constants: Record<string, number>;
    approximation: Record<string, Data>;
}
