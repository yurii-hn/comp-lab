from sympy import diff, sympify, Symbol
from sympy.abc import _clash

from validateExpression import validateExpression


def validateCostFunction(payload):
    """Cost function validation function"""

    # Unpacking the payload
    func = payload['func']
    allowedSymbols = payload['allowedSymbols']
    interventions = payload['interventions']

    # Initializing the validation result
    validationResult = {
        'isValid': True,
        'message': ''
    }

    # Validating the expression
    validateExpressionData = {
        'expression': func,
        'allowedSymbols': allowedSymbols
    }

    # Validating the expression
    validateExpressionResult = validateExpression(validateExpressionData)

    # Checking if the expression is valid
    if not validateExpressionResult['isValid']:
        return validateExpressionResult

    # Validating the cost function
    symbolicFunction = sympify(func, evaluate=False, locals=_clash)

    # Checking if the cost function contains all interventions
    for intervention in interventions:
        interventionSymbol = Symbol(intervention)
        derivative = diff(symbolicFunction, interventionSymbol)

        if interventionSymbol not in derivative.free_symbols:
            validationResult['isValid'] = False
            validationResult[
                'message'] = f'Derivative of cost function does not contain intervention "{intervention}"'

            break

    return validationResult
