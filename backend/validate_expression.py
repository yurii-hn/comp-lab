"""
Validation module

This module contains the expression validation function
"""


from typing import List, Set, Dict, cast
from sympy import sympify, symbols, Expr, Symbol
from sympy.core.sympify import SympifyError
from sympy.abc import _clash

from definitions import IValidationPayload, IValidationResult


def validate_expression(payload: IValidationPayload) -> IValidationResult:
    """
    Validation function

    This function validates the expression

    Parameters
    ----------
    payload : IValidationPayload
        Payload

    Returns
    -------
    IValidationResult
        Validation result
    """

    if '' in _clash:
        del _clash['']

    validation_result: IValidationResult = IValidationResult(True, '')

    try:
        symbolic_expression: Expr = sympify(
            payload.expression,
            evaluate=False,
            locals=_clash
        )
        symbols_in_expression: List[Symbol] = list(
            cast(
                Set[Symbol],
                symbolic_expression.free_symbols
            )
        )

        allowed_symbols_set: Set[Symbol] = set(
            symbols(payload.allowed_symbols)
        )

        variables_availability_dict: Dict[str, bool] = {
            str(variable): variable in allowed_symbols_set for variable in symbols_in_expression
        }

        if not all(variables_availability_dict.values()):
            unknown_variables: List[str] = [
                str(variable)
                for variable, available in variables_availability_dict.items() if not available
            ]

            validation_result.is_valid = False
            validation_result.message = (
                'The string contains variables that are not known to the system: ' +
                ', '.join(f'"{var}"' for var in unknown_variables)
            )

    except SympifyError:
        validation_result.is_valid = False
        validation_result.message = 'The string is not a valid symbolic expression'

    return validation_result
