import { Values } from './common.types';

export interface SimulationParameters {
    time: number;
    nodesAmount: number;
}

export interface SimulationResult {
    compartments: Values[];
}
