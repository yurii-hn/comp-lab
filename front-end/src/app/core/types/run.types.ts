import {
    OptimalControlSuccessResponse,
    PISuccessResponse,
    SimulationSuccessResponse,
} from './processing';

export interface IRun<DataType = any> {
    name: string;
    data: DataType;
}

export type SimulationData = SimulationSuccessResponse;
export type OptimalControlData = OptimalControlSuccessResponse;
export type PIData = PISuccessResponse;
export type Data = SimulationData | OptimalControlData | PIData;

export type SimulationRun = IRun<SimulationData>;
export type OptimalControlRun = IRun<OptimalControlData>;
export type PIRun = IRun<PIData>;
export type Run = SimulationRun | OptimalControlRun | PIRun;
