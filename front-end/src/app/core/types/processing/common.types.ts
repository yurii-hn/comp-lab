import { IModel } from '../model.types';

export interface IPoint {
    time: number;
    value: number;
}

export interface IValues {
    name: string;
    values: IPoint[];
}

export interface IRequestBody<ParametersType = any> {
    parameters: ParametersType;
    model: IModel;
}

export interface IErrorResponse {
    error: string;
}

export interface ISuccessResponse<ParametersType = any, ResultType = any> {
    parameters: ParametersType;
    result: ResultType;
}

export interface IValidationResponse {
    valid: boolean;
    message?: string;
}
