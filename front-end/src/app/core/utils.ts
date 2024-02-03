import {
    IOptimalControlSuccessResponse,
    ISimulationSuccessResponse,
} from './interfaces';

export function isOptimalControlResults(
    response: ISimulationSuccessResponse | IOptimalControlSuccessResponse
): response is IOptimalControlSuccessResponse {
    return 'interventions' in response;
}
