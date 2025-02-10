import {
  OptimalControlSuccessResponse,
  PISuccessResponse,
  SimulationSuccessResponse,
} from '@core/types/processing/api.types';

export interface BaseRun<DataType = any> {
    name: string;
    data: DataType;
}

export type SimulationData = SimulationSuccessResponse;
export type OptimalControlData = OptimalControlSuccessResponse;
export type PIData = PISuccessResponse;
export type Data = SimulationData | OptimalControlData | PIData;

export type SimulationRun = BaseRun<SimulationData>;
export type OptimalControlRun = BaseRun<OptimalControlData>;
export type PIRun = BaseRun<PIData>;
export type Run = SimulationRun | OptimalControlRun | PIRun;
