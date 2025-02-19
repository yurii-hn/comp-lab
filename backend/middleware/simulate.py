"""Simulation Middleware"""

from core.classes.common.error_response import ErrorResponse
from core.classes.common.values import Values
from core.classes.model.model import Model
from core.classes.model.variables_datatable import VariablesDatatable
from core.classes.simulation.parameters import SimulationParameters
from core.classes.simulation.success_response import SimulationSuccessResponse
from core.definitions.common.approximation_type import ApproximationType
from core.definitions.model.continuity_type import ContinuityType
from sympy import Interval, oo


def simulate(
    parameters: SimulationParameters, model: Model
) -> SimulationSuccessResponse | ErrorResponse:
    """Simulation"""

    for compartment in model.compartments:
        continuity_status: dict[str, ContinuityType] = {
            str(symbol): compartment.equation.check_continuity(symbol, Interval(0, oo))
            for symbol in model.compartments_symbols
        }

        if not all(
            [
                continuity_type == ContinuityType.CONTINUOUS
                for continuity_type in continuity_status.values()
            ]
        ):
            discontinuous_symbols: list[str] = [
                symbol
                for symbol, continuity_type in continuity_status.items()
                if continuity_type == ContinuityType.DISCONTINUOUS
            ]

            return ErrorResponse(
                {
                    "error": f"Equation of {compartment.name} is discontinuous by:\n"
                    + ", ".join(f'"{variable}"' for variable in discontinuous_symbols)
                }
            )

    if not model.population_preserved:
        return ErrorResponse(
            {
                "error": "Model equations do not preserve population\n\n"
                + "Apparently that is result of a program bug. Please reload the page and try again",
            }
        )

    try:
        variables_datatable: VariablesDatatable = VariablesDatatable()

        variables_datatable.update_constants(
            {
                constant.name: Values(
                    {
                        "name": constant.name,
                        "values": [
                            {"time": 0, "value": constant.value},
                        ],
                    },
                    ApproximationType.PIECEWISE_CONSTANT,
                )
                for constant in model.constants
            }
        )

        variables_datatable.update_interventions(
            {
                intervention.name: Values(
                    {
                        "name": intervention.name,
                        "values": [
                            {"time": 0, "value": 0},
                        ],
                    },
                    ApproximationType.PIECEWISE_CONSTANT,
                )
                for intervention in model.interventions
            }
        )

        model.simulate(
            parameters.time / parameters.nodes_amount,
            parameters.nodes_amount,
            variables_datatable,
        )

        return SimulationSuccessResponse(
            {
                "parameters": parameters.definition,
                "model": model.definition,
                "result": {"compartments": variables_datatable.compartments_definition},
            }
        )

    except ValueError as error:
        return ErrorResponse({"error": str(error)})
