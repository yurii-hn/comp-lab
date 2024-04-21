import {
    IOptimalControlSuccessResponseData,
    IPISuccessResponseData,
    IResponseData,
    ISimulationSuccessResponseData,
    isOptimalControlParameters,
    isOptimalControlResponsePayload,
    isPIParameters,
    isPIResponsePayload,
    isResponseData,
    isSimulationParameters,
    isSimulationResponsePayload
} from './processing';

export interface IResultsBase {
    name: string;
}

export function isResultsBase(resultsBase: any): resultsBase is IResultsBase {
    const isKeysAmountValid: boolean = Object.keys(resultsBase).length === 1;
    const isNameValid: boolean =
        'name' in resultsBase && typeof resultsBase.name === 'string';

    return isKeysAmountValid && isNameValid;
}

export type ISimulationResultsData = Omit<
    ISimulationSuccessResponseData,
    'success'
>;

export function isSimulationResultsData(
    simulationResultsData: any
): simulationResultsData is ISimulationResultsData {
    const isKeysAmountValid: boolean =
        Object.keys(simulationResultsData).length === 2;
    const isParametersValid: boolean =
        'parameters' in simulationResultsData &&
        isSimulationParameters(simulationResultsData.parameters);
    const isPayloadValid: boolean =
        'payload' in simulationResultsData &&
        isSimulationResponsePayload(simulationResultsData.payload);

    return isKeysAmountValid && isParametersValid && isPayloadValid;
}

export type IOptimalControlResultsData = Omit<
    IOptimalControlSuccessResponseData,
    'success'
>;

export function isOptimalControlResultsData(
    optimalControlResultsData: any
): optimalControlResultsData is IOptimalControlResultsData {
    const isKeysAmountValid: boolean =
        Object.keys(optimalControlResultsData).length === 2;
    const isParametersValid: boolean =
        'parameters' in optimalControlResultsData &&
        isOptimalControlParameters(optimalControlResultsData.parameters);
    const isPayloadValid: boolean =
        'payload' in optimalControlResultsData &&
        isOptimalControlResponsePayload(optimalControlResultsData.payload);

    return isKeysAmountValid && isParametersValid && isPayloadValid;
}

export type IPIResultsResultsData = Omit<IPISuccessResponseData, 'success'>;

export function isPIResultsResultsData(
    piResultsResultsData: any
): piResultsResultsData is IPIResultsResultsData {
    const isKeysAmountValid: boolean =
        Object.keys(piResultsResultsData).length === 2;
    const isParametersValid: boolean =
        'parameters' in piResultsResultsData &&
        isPIParameters(piResultsResultsData.parameters);
    const isPayloadValid: boolean =
        'payload' in piResultsResultsData &&
        isPIResponsePayload(piResultsResultsData.payload);

    return isKeysAmountValid && isParametersValid && isPayloadValid;
}

export interface ISimulationResultsBody {
    data: ISimulationResultsData;
}

export function isSimulationResultsBody(
    simulationResultsBody: any
): simulationResultsBody is ISimulationResultsBody {
    const isKeysAmountValid: boolean =
        Object.keys(simulationResultsBody).length === 1;
    const isDataValid: boolean =
        'data' in simulationResultsBody &&
        isSimulationResultsData(simulationResultsBody.data);

    return isKeysAmountValid && isDataValid;
}

export interface IOptimalControlResultsBody {
    data: IOptimalControlResultsData;
}

export function isOptimalControlResultsBody(
    optimalControlResultsBody: any
): optimalControlResultsBody is IOptimalControlResultsBody {
    const isKeysAmountValid: boolean =
        Object.keys(optimalControlResultsBody).length === 1;
    const isDataValid: boolean =
        'data' in optimalControlResultsBody &&
        isOptimalControlResultsData(optimalControlResultsBody.data);

    return isKeysAmountValid && isDataValid;
}

export interface IPIResultsBody {
    data: IPIResultsResultsData;
}

export function isPIResultsBody(
    piResultsBody: any
): piResultsBody is IPIResultsBody {
    const isKeysAmountValid: boolean = Object.keys(piResultsBody).length === 1;
    const isDataValid: boolean =
        'data' in piResultsBody && isPIResultsResultsData(piResultsBody.data);

    return isKeysAmountValid && isDataValid;
}

export type IResultsBody =
    | ISimulationResultsBody
    | IOptimalControlResultsBody
    | IPIResultsBody;

export function isResultsBody(resultsBody: any): resultsBody is IResultsBody {
    return (
        isSimulationResultsBody(resultsBody) ||
        isOptimalControlResultsBody(resultsBody) ||
        isPIResultsBody(resultsBody)
    );
}

export type ISimulationResults = IResultsBase & ISimulationResultsBody;

export function isSimulationResults(
    simulationResults: any
): simulationResults is ISimulationResults {
    const isKeysAmountValid: boolean =
        Object.keys(simulationResults).length === 2;
    const isNameValid: boolean =
        'name' in simulationResults &&
        typeof simulationResults.name === 'string';
    const isBodyValid: boolean =
        'data' in simulationResults &&
        isSimulationResultsData(simulationResults.data);

    return isKeysAmountValid && isNameValid && isBodyValid;
}

export type IOptimalControlResults = IResultsBase &
    IOptimalControlResultsBody & {
        viewMode: OptimalControlResultsViewMode;
    };

export function isOptimalControlResults(
    optimalControlResults: any
): optimalControlResults is IOptimalControlResults {
    const isKeysAmountValid: boolean =
        Object.keys(optimalControlResults).length === 3;
    const isNameValid: boolean =
        'name' in optimalControlResults &&
        typeof optimalControlResults.name === 'string';
    const isBodyValid: boolean =
        'data' in optimalControlResults &&
        isOptimalControlResultsData(optimalControlResults.data);
    const isViewModeValid: boolean =
        'viewMode' in optimalControlResults &&
        isOptimalControlResultsViewMode(optimalControlResults.viewMode);

    return isKeysAmountValid && isNameValid && isBodyValid && isViewModeValid;
}

export type IPIResults = IResultsBase & IPIResultsBody;

export function isPIResults(piResults: any): piResults is IPIResults {
    const isKeysAmountValid: boolean = Object.keys(piResults).length === 2;
    const isNameValid: boolean =
        'name' in piResults && typeof piResults.name === 'string';
    const isBodyValid: boolean =
        'data' in piResults && isPIResultsResultsData(piResults.data);

    return isKeysAmountValid && isNameValid && isBodyValid;
}

export type IResults = ISimulationResults | IOptimalControlResults | IPIResults;

export function isResults(results: any): results is IResults {
    return (
        isSimulationResults(results) ||
        isOptimalControlResults(results) ||
        isPIResults(results)
    );
}

export type IImportSimulationResults = ISimulationResultsData;

export function isImportSimulationResults(
    importSimulationResults: any
): importSimulationResults is IImportSimulationResults {
    return isSimulationResultsData(importSimulationResults);
}

export type IImportOptimalControlResults = IOptimalControlResultsData;

export function isImportOptimalControlResults(
    importOptimalControlResults: any
): importOptimalControlResults is IImportOptimalControlResults {
    return isOptimalControlResultsData(importOptimalControlResults);
}

export type IImportPIResults = IPIResultsResultsData;

export function isImportPIResults(
    importPIResults: any
): importPIResults is IImportPIResults {
    return isPIResultsResultsData(importPIResults);
}

export type IImportResults =
    | IImportSimulationResults
    | IImportOptimalControlResults
    | IImportPIResults;

export function isImportResults(
    importResults: any
): importResults is IImportResults {
    return (
        isImportSimulationResults(importResults) ||
        isImportOptimalControlResults(importResults) ||
        isImportPIResults(importResults)
    );
}

export type IExportSimulationResults = ISimulationResultsData;

export function isExportSimulationResults(
    exportSimulationResults: any
): exportSimulationResults is IExportSimulationResults {
    return isSimulationResultsData(exportSimulationResults);
}

export type IExportOptimalControlResults = IOptimalControlResultsData;

export function isExportOptimalControlResults(
    exportOptimalControlResults: any
): exportOptimalControlResults is IExportOptimalControlResults {
    return isOptimalControlResultsData(exportOptimalControlResults);
}

export type IExportPIResults = IPIResultsResultsData;

export function isExportPIResults(
    exportPIResults: any
): exportPIResults is IExportPIResults {
    return isPIResultsResultsData(exportPIResults);
}

export type IExportResults =
    | IExportSimulationResults
    | IExportOptimalControlResults
    | IExportPIResults;

export function isExportResults(
    exportResults: any
): exportResults is IExportResults {
    return (
        isExportSimulationResults(exportResults) ||
        isExportOptimalControlResults(exportResults) ||
        isExportPIResults(exportResults)
    );
}

export type IExportSolution = IResponseData[];

export function isExportSolution(
    exportSolution: any
): exportSolution is IExportSolution {
    return (
        Array.isArray(exportSolution) &&
        exportSolution.every((response: any) => isResponseData(response))
    );
}

export type IImportSolution = IExportSolution;

export function isImportSolution(
    importSolution: any
): importSolution is IImportSolution {
    return isExportSolution(importSolution);
}

export enum OptimalControlResultsViewMode {
    NonOptimized = 'non-optimized',
    Optimized = 'optimized',
}

export function isOptimalControlResultsViewMode(
    optimalControlResultsViewMode: any
): optimalControlResultsViewMode is OptimalControlResultsViewMode {
    return Object.values(OptimalControlResultsViewMode).includes(
        optimalControlResultsViewMode
    );
}
