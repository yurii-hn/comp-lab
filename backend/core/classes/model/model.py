"""Model Class"""

from typing import cast

from core.classes.common.values import Values
from core.classes.model.compartment import Compartment
from core.classes.model.constant import Constant
from core.classes.model.flow import Flow
from core.classes.model.intervention import Intervention
from core.classes.model.variables_datatable import VariablesDatatable
from core.definitions.model.model import ModelDefinition
from core.definitions.model.symbols_table import SymbolsTable
from numpy import linspace
from scipy.integrate import solve_ivp
from sympy import Expr, Symbol, nsimplify


class Model:
    """Model"""

    compartments: list[Compartment]
    constants: list[Constant]
    interventions: list[Intervention]
    flows: list[Flow]

    symbols_table: SymbolsTable

    @property
    def definition(self) -> ModelDefinition:
        """Definition"""

        return {
            "compartments": [
                compartment.definition for compartment in self.compartments
            ],
            "constants": [constant.definition for constant in self.constants],
            "interventions": [
                intervention.definition for intervention in self.interventions
            ],
            "flows": [flow.definition for flow in self.flows],
        }

    @property
    def compartments_symbols(self) -> list[Symbol]:
        """Compartments symbols"""

        return [compartment.symbol for compartment in self.compartments]

    @property
    def constants_symbols(self) -> list[Symbol]:
        """Constants symbols"""

        return [constant.symbol for constant in self.constants]

    @property
    def interventions_symbols(self) -> list[Symbol]:
        """Interventions symbols"""

        return [intervention.symbol for intervention in self.interventions]

    @property
    def population_preserved(self) -> bool:
        """Is population preserved"""

        accumulator: Expr = cast(Expr, 0)

        for equation in [
            compartment.equation.expression for compartment in self.compartments
        ]:
            accumulator += equation  # type: ignore

        if nsimplify(accumulator, tolerance=1e-10) != 0:
            return False

        return True

    def __init__(self, definition: ModelDefinition) -> None:
        self.compartments = []
        self.constants = []
        self.interventions = []
        self.flows = []

        self.symbols_table = {}

        for compartment in definition["compartments"]:
            self.symbols_table[compartment["name"]] = Symbol(compartment["name"])

            self.compartments.append(Compartment(compartment))

        for constant in definition["constants"]:
            self.symbols_table[constant["name"]] = Symbol(constant["name"])

            self.constants.append(Constant(constant))

        for intervention in definition["interventions"]:
            self.symbols_table[intervention["name"]] = Symbol(intervention["name"])

            self.interventions.append(Intervention(intervention))

        for flow in definition["flows"]:
            self.flows.append(Flow(flow))

            source: Compartment = next(
                compartment
                for compartment in self.compartments
                if compartment.id == flow["source"]
            )
            target: Compartment = next(
                compartment
                for compartment in self.compartments
                if compartment.id == flow["target"]
            )

            source.add_outflow(flow["equation"], self.symbols_table)
            target.add_inflow(flow["equation"], self.symbols_table)

    def simulate(
        self,
        step_size: float,
        nodes_amount: int,
        variables_datatable: VariablesDatatable,
        ignore_negative_values: bool = False,
    ) -> None:
        """Simulate model"""

        symbol_to_index_map: dict[Symbol, int] = {
            symbol: i for i, symbol in enumerate(self.compartments_symbols)
        }
        t = linspace(0, nodes_amount * step_size, nodes_amount + 1)

        result = solve_ivp(
            self.model,
            (0, nodes_amount * step_size),
            [compartment.value for compartment in self.compartments],
            args=(
                symbol_to_index_map,
                variables_datatable,
            ),
            method="LSODA",
            dense_output=True,
            t_eval=t,
        )

        if not all([min(y) >= 0 for y in result.y]) and not ignore_negative_values:
            compartment_index: int = next(
                i for i, y in enumerate(result.y) if min(y) < 0
            )

            t: float = next(
                t for i, t in enumerate(result.t) if result.y[compartment_index][i] < 0
            )

            raise ValueError(
                f"Negative value for {self.compartments[compartment_index]} at time {t}"
            )

        variables_datatable.update_compartments(
            {
                self.compartments[i].name: Values(
                    {
                        "name": self.compartments[i].name,
                        "values": [
                            {
                                "time": t,
                                "value": y,
                            }
                            for t, y in zip(result.t, result.y[i])
                        ],
                    },
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
            compartment.equation.calculate(
                [
                    (
                        y[symbol_to_index_map[symbol]]
                        if symbol in symbol_to_index_map
                        else variables_datatable[str(symbol)](t)
                    )
                    for symbol in compartment.equation.variables
                ]
            )
            for compartment in self.compartments
        ]
