import { Data } from '@core/types/processing/common.types';

export interface SimulationParameters {
    time: number;
    nodesAmount: number;
}

export interface SimulationResult {
    compartments: Record<string, Data>;
}
