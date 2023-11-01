function validationResult = validateCostFunction(payloadJson)
    payload = jsondecode(payloadJson);

    func = payload.func;
    allowedSymbols = payload.allowedSymbols;
    interventions = payload.interventions;

    validationResult = struct();

    validationResult.isValid = true;
    validationResult.message = '';

    validateExpressionData = struct();
    validateExpressionData.expression = func;
    validateExpressionData.allowedSymbols = cellArray(allowedSymbols);

    validateExpressionResult = validateExpression(jsonencode(validateExpressionData));

    if ~validateExpressionResult.isValid
        validationResult = validateExpressionResult;

        return;
    end

    func = str2sym(func);

    % Get derivative of function and check whether all interventions are in the derivative
    for i = 1:length(interventions)
        intervention = interventions(i);

        derivative = diff(func, intervention);

        if ~contains(char(derivative), intervention)
            validationResult = struct('isValid', false, 'message', sprintf('Derivative of cost function does not contain intervention %s', char(intervention)));

            return;
        end
    end
end
