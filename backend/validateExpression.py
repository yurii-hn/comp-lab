from sympy import sympify, symbols
from sympy.core.sympify import SympifyError
from sympy.abc import _clash


def validateExpression(payload):
    """Expression validation function"""

    if '' in _clash:
        del _clash['']

    # Unpacking the payload
    expression = payload['expression']
    allowedSymbols = payload['allowedSymbols']

    # Initializing the validation result
    validationResult = {
        'isValid': True,
        'message': ''
    }

    # Validating the expression
    try:
        # Converting the expression to a symbolic expression
        symbolicExpression = sympify(expression, evaluate=False, locals=_clash)
        symbolsInExpression = symbolicExpression.free_symbols

        # Checking if the expression contains only allowed symbols
        allowedSymbolsSet = set(symbols(allowedSymbols))

        variablesAvailability = {
            str(variable): variable in allowedSymbolsSet for variable in symbolsInExpression}

        if not all(variablesAvailability.values()):
            # Getting the unknown variables
            unknownVariables = [
                str(variable) for variable, available in variablesAvailability.items() if not available]

            # Setting the validation result
            validationResult['isValid'] = False
            validationResult['message'] = ('The string contains variables that are not known to the system: ' +
                                           ', '.join(f'"{var}"' for var in unknownVariables))

    # Handling the exception
    except SympifyError:
        validationResult['isValid'] = False
        validationResult['message'] = 'The string is not a valid symbolic expression'

    return validationResult
