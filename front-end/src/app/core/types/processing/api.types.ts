import { Model } from '@core/types/model.types';
import { ProcessingType } from '@core/types/processing/common.types';
import {
  OptimalControlParameters,
  OptimalControlResult,
} from '@core/types/processing/optimal-control.types';
import {
  PIParameters,
  PIResult,
} from '@core/types/processing/parameters-identification.types';
import {
  SimulationParameters,
  SimulationResult,
} from '@core/types/processing/simulation.types';

export interface ErrorResponse {
    error: string;
}

export interface SimulationRequestBody {
    parameters: SimulationParameters;
    model: Model;
}

export interface SimulationSuccessResponse {
    type: ProcessingType.Simulation;
    parameters: SimulationParameters;
    model: Model;
    result: SimulationResult;
}

export interface OptimalControlRequestBody {
    parameters: OptimalControlParameters;
    model: Model;
}

export interface OptimalControlSuccessResponse {
    type: ProcessingType.OptimalControl;
    parameters: OptimalControlParameters;
    model: Model;
    result: [SimulationResult, OptimalControlResult];
}

export interface PIRequestBody {
    parameters: PIParameters;
    model: Model;
}

export interface PISuccessResponse {
    type: ProcessingType.PI;
    parameters: PIParameters;
    model: Model;
    result: PIResult;
}
