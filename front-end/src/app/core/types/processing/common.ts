export interface IRequestData<ParametersType = any, PayloadType = any> {
    parameters: ParametersType;
    payload: PayloadType;
}

export function isRequestData(requestData: any): requestData is IRequestData {
    const isKeysAmountValid: boolean = Object.keys(requestData).length === 2;
    const isParametersValid: boolean = 'parameters' in requestData;
    const isPayloadValid: boolean = 'payload' in requestData;

    return isKeysAmountValid && isParametersValid && isPayloadValid;
}

export interface IResponseData {
    name: string;
    values: number[];
}

export function isResponseData(
    responseData: any
): responseData is IResponseData {
    const isKeysAmountValid: boolean = Object.keys(responseData).length === 2;
    const isNameValid: boolean =
        'name' in responseData && typeof responseData.name === 'string';
    const isValuesValid: boolean =
        'values' in responseData &&
        Array.isArray(responseData.values) &&
        responseData.values.every(
            (value: any): boolean => typeof value === 'number'
        );

    return isKeysAmountValid && isNameValid && isValuesValid;
}

export interface IErrorResponseData {
    error: string;
    success: false;
}

export function isErrorResponseData(
    errorResponseData: any
): errorResponseData is IErrorResponseData {
    const isKeysAmountValid: boolean =
        Object.keys(errorResponseData).length === 2;
    const isErrorValid: boolean =
        'error' in errorResponseData &&
        typeof errorResponseData.error === 'string';
    const isSuccessValid: boolean =
        'success' in errorResponseData && errorResponseData.success === false;

    return isKeysAmountValid && isErrorValid && isSuccessValid;
}

export interface ISuccessResponseData<ParametersType = any, PayloadType = any> {
    parameters: ParametersType;
    payload: PayloadType;
    success: true;
}

export function isSuccessResponseData(
    successResponseData: any
): successResponseData is ISuccessResponseData {
    const isKeysAmountValid: boolean =
        Object.keys(successResponseData).length === 3;
    const isParametersValid: boolean = 'parameters' in successResponseData;
    const isPayloadValid: boolean = 'payload' in successResponseData;
    const isSuccessValid: boolean =
        'success' in successResponseData &&
        successResponseData.success === true;

    return (
        isKeysAmountValid &&
        isParametersValid &&
        isPayloadValid &&
        isSuccessValid
    );
}

export interface IValidationResponse {
    isValid: boolean;
    message?: string;
}

export function isValidationResponse(
    validationResponse: any
): validationResponse is IValidationResponse {
    const keysAmount: number = Object.keys(validationResponse).length;

    const isKeysAmountValid: boolean = keysAmount <= 2;

    const isValidValid: boolean =
        'isValid' in validationResponse &&
        typeof validationResponse.isValid === 'boolean';

    if (keysAmount === 2) {
        const isMessageValid: boolean =
            'message' in validationResponse &&
            typeof validationResponse.message === 'string';

        return isKeysAmountValid && isValidValid && isMessageValid;
    }

    return isKeysAmountValid && isValidValid;
}
