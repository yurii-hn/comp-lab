from typing import cast
import sympy as sp
from sympy.abc import _clash

from classes.validate_expression.validation_response import ValidationResponse


def validate_expression(
    expression: str, allowed_symbols: list[str]
) -> ValidationResponse:
    if "" in _clash:
        del _clash[""]

    try:
        symbolic_expression: sp.Expr = sp.sympify(
            expression, evaluate=False, locals=_clash
        )
        symbols_in_expression: list[sp.Symbol] = cast(
            list[sp.Symbol], list(symbolic_expression.free_symbols)
        )

        allowed_status: dict[str, bool] = {
            str(variable): variable in set(sp.symbols(allowed_symbols))
            for variable in symbols_in_expression
        }

        if not all(allowed_status.values()):
            unknown_variables: list[str] = [
                variable for variable, allowed in allowed_status.items() if not allowed
            ]

            return {
                "valid": False,
                "message": (
                    "Expression contains variables that are not known to the system: "
                    + ", ".join(f'"{variable}"' for variable in unknown_variables)
                ),
            }

    except sp.SympifyError:
        return {
            "valid": False,
            "message": "Expression is not a valid",
        }

    return {
        "valid": True,
        "message": None,
    }
