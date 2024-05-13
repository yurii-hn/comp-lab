import {
    isOptimalControlSuccessResponse
} from './processing/optimal-control.guards';
import {
    isPISuccessResponse
} from './processing/parameters-identification.guards';
import {
    isSimulationSuccessResponse
} from './processing/simulation.guards';
import {
    Data,
    IRun,
    OptimalControlData,
    OptimalControlRun,
    PIData,
    PIRun,
    Run,
    SimulationData,
    SimulationRun,
} from './run.types';

export function isIRun(iRun: any): iRun is IRun {
    const isKeysAmountValid: boolean = Object.keys(iRun).length === 2;

    const isNameValid: boolean =
        'name' in iRun && typeof iRun.name === 'string';
    const isDataValid: boolean = 'data' in iRun;

    return isKeysAmountValid && isNameValid && isDataValid;
}

export function isSimulationData(
    simulationData: any
): simulationData is SimulationData {
    return isSimulationSuccessResponse(simulationData);
}

export function isOptimalControlData(
    optimalControlData: any
): optimalControlData is OptimalControlData {
    return isOptimalControlSuccessResponse(optimalControlData);
}

export function isPIData(piData: any): piData is PIData {
    return isPISuccessResponse(piData);
}

export function isData(data: any): data is Data {
    return (
        isSimulationData(data) || isOptimalControlData(data) || isPIData(data)
    );
}

export function isSimulationRun(
    simulationRun: any
): simulationRun is SimulationRun {
    const isIRunValid: boolean = isIRun(simulationRun);

    const isDataValid: boolean = isSimulationData(simulationRun.data);

    return isIRunValid && isDataValid;
}

export function isOptimalControlRun(
    optimalControlRun: any
): optimalControlRun is OptimalControlRun {
    const isIRunValid: boolean = isIRun(optimalControlRun);

    const isDataValid: boolean = isOptimalControlData(optimalControlRun.data);

    return isIRunValid && isDataValid;
}

export function isPIRun(piRun: any): piRun is PIRun {
    const isIRunValid: boolean = isIRun(piRun);

    const isDataValid: boolean = isPIData(piRun.data);

    return isIRunValid && isDataValid;
}

export function isRun(run: any): run is Run {
    return isSimulationRun(run) || isOptimalControlRun(run) || isPIRun(run);
}
