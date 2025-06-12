import numpy as np
import numpy.typing as npt
import sympy as sp
from sympy.calculus.util import continuous_domain
from typing import Any, Callable, cast

from classes.model.datatable import Datatable
from classes.model.continuity_type import ContinuityType


class Equation:
    variables: list[sp.Symbol]
    expression: sp.Expr
    _function: Callable

    def __init__(self) -> None:
        self.variables = []
        self.expression = cast(sp.Expr, 0)
        self._function = lambda *args: np.float64(0)

    def calculate(self, values: npt.ArrayLike) -> Any:
        return self._function(*np.asarray(values, dtype=np.float64))

    def calculate_interval(
        self,
        times: npt.NDArray[np.float64],
        variables_datatable: Datatable,
    ) -> np.float64:
        values: npt.NDArray[np.float64] = self.calculate(
            [variables_datatable[variable.name](times) for variable in self.variables]
        )

        return np.float64(np.trapezoid(values, times))

    def check_continuity(
        self,
        raw_variable: str,
        interval: sp.Interval | sp.FiniteSet,
        derivative: bool = False,
    ) -> ContinuityType:
        variable: sp.Symbol = sp.Symbol(raw_variable)

        if not continuous_domain(self.expression, variable, interval) == interval:
            return ContinuityType.DISCONTINUOUS

        if derivative:
            if (
                not continuous_domain(
                    sp.diff(self.expression, variable), variable, interval
                )
                == interval
            ):
                return ContinuityType.CONTINUOUS

        return (
            ContinuityType.CONTINUOUSLY_DIFFERENTIABLE
            if derivative
            else ContinuityType.CONTINUOUS
        )

    def add(self, equation: sp.Expr) -> None:
        self.expression += equation  # type: ignore

        self.__update_function()

    def subtract(self, equation: sp.Expr) -> None:
        self.add(-equation)

    def add_str(self, equation: str, symbols: list[str]) -> None:
        self.expression += sp.sympify(
            equation.replace("^", "**"),
            {symbol: sp.Symbol(symbol) for symbol in symbols},
        )

        self.__update_function()

    def subtract_str(self, equation: str, symbols: list[str]) -> None:
        self.add_str(f"-({equation})", symbols)

    def __update_function(self) -> None:
        variables: list[sp.Symbol] = cast(
            list[sp.Symbol], list(self.expression.free_symbols)
        )

        self.variables = variables
        self._function = sp.lambdify(variables, self.expression, modules="numpy")
