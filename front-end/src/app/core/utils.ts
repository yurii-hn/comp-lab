import {
    IOptimalControlResultsBase,
    IResultsBase
} from './interfaces';

export function isOptimalControlResults(
    results: IResultsBase
): results is IOptimalControlResultsBase {
    return (
        Array.isArray(results.data.payload) && results.data.payload.length === 2
    );
}
