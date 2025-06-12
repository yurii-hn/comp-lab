import {
  OptimalControlSuccessResponse,
  PISuccessResponse,
  SimulationSuccessResponse,
} from '@core/types/processing/api.types';

export interface BaseRun<DataType = any> {
    name: string;
    data: DataType;
}

export type SimulationResult = SimulationSuccessResponse;
export type OptimalControlResult = OptimalControlSuccessResponse;
export type PIResult = PISuccessResponse;
export type Result = SimulationResult | OptimalControlResult | PIResult;

export type SimulationRun = BaseRun<SimulationResult>;
export type OptimalControlRun = BaseRun<OptimalControlResult>;
export type PIRun = BaseRun<PIResult>;
export type Run = SimulationRun | OptimalControlRun | PIRun;
