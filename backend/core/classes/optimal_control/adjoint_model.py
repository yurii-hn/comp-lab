"""Adjoint Model Class"""

from core.classes.common.values import Values
from core.classes.model.equation import Equation
from core.classes.model.variables_datatable import VariablesDatatable
from core.classes.optimal_control.lambda_derivative import LambdaDerivative
from numpy import linspace
from scipy.integrate import solve_ivp
from sympy import Symbol


class AdjointModel:
    """Adjoint Model"""

    lambdas: list[LambdaDerivative]

    @property
    def lambdas_symbols(self) -> list[Symbol]:
        """Lambdas symbols"""

        return [current_lambda.symbol for current_lambda in self.lambdas]

    def __init__(self, compartments: list[Symbol], hamiltonian: Equation) -> None:
        self.lambdas = [
            LambdaDerivative(f"lambda_{compartment}", compartment, hamiltonian)
            for compartment in compartments
        ]

    def simulate(
        self,
        step_size: float,
        nodes_amount: int,
        variables_datatable: VariablesDatatable,
    ) -> None:
        """Simulate model"""

        symbol_to_index_map: dict[Symbol, int] = {
            symbol: i for i, symbol in enumerate(self.lambdas_symbols)
        }
        t = linspace(0, nodes_amount * step_size, nodes_amount + 1)[::-1]

        result = solve_ivp(
            self.model,
            (nodes_amount * step_size, 0),
            [0] * len(self.lambdas),
            args=(symbol_to_index_map, variables_datatable),
            method="RK45",
            dense_output=True,
            t_eval=t,
        )

        variables_datatable.update_lambdas(
            {
                self.lambdas[i].name: Values(
                    {
                        "name": self.lambdas[i].name,
                        "values": [
                            {
                                "time": t,
                                "value": y,
                            }
                            for t, y in zip(result.t, result.y[i])
                        ][::-1],
                    }
                )
                for i in symbol_to_index_map.values()
            }
        )

    def model(
        self,
        t: float,
        y: list[float],
        symbol_to_index_map: dict[Symbol, int],
        variables_datatable: VariablesDatatable,
    ) -> list[float]:
        """Model"""

        return [
            current_lambda.equation.calculate(
                [
                    (
                        y[symbol_to_index_map[symbol]]
                        if symbol in symbol_to_index_map
                        else variables_datatable[str(symbol)](t)
                    )
                    for symbol in current_lambda.equation.variables
                ]
            )
            for current_lambda in self.lambdas
        ]
