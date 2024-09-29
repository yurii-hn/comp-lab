"""Parameters Identification Middleware"""

from typing import cast

from core.classes.common.error_response import ErrorResponse
from core.classes.common.values import Values
from core.classes.model.model import Model
from core.classes.model.variables_datatable import VariablesDatatable
from core.classes.parameters_identification.parameters import PIParameters
from core.classes.parameters_identification.response import PIResponse
from core.classes.parameters_identification.success_response import \
    PISuccessResponse
from core.definitions.model.continuity_type import ContinuityType
from core.definitions.optimal_control.approximation_type import \
    ApproximationType
from core.definitions.parameters_identification.result import \
    PIResultDefinition
from scipy.optimize import OptimizeResult, minimize
from sympy import Interval, oo


def parameters_identification(parameters: PIParameters, model: Model) -> PIResponse:
    """Identify the parameters"""

    model.symbols_table.update(
        {constant.name: constant.symbol for constant in parameters.selected_constants}
    )

    for compartment in model.compartments:
        continuity_status: dict[str, ContinuityType] = {
            **{
                str(symbol): compartment.equation.check_continuity(
                    symbol, Interval(0, oo)
                )
                for symbol in model.compartments_symbols
            },
            **{
                constant.name: compartment.equation.check_continuity(
                    constant.symbol,
                    Interval(constant.lower_boundary, constant.upper_boundary),
                )
                for constant in parameters.selected_constants
            },
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
                    + ", ".join(discontinuous_symbols)
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

        minimize_result: OptimizeResult = cast(
            OptimizeResult,
            minimize(
                optimization_criteria,
                [constant.value for constant in parameters.selected_constants],
                args=(parameters, model, variables_datatable),
                bounds=[
                    (constant.lower_boundary, constant.upper_boundary)
                    for constant in parameters.selected_constants
                ],
                method="L-BFGS-B",
                tol=1e-3,
            ),
        )

        result: PIResultDefinition = {
            "approximation": variables_datatable.compartments_definition,
            "constants": [
                {
                    "id": constant.id,
                    "name": constant.name,
                    "value": minimize_result.x[i],
                }
                for i, constant in enumerate(parameters.selected_constants)
            ],
        }

        return PISuccessResponse(
            {
                "parameters": parameters.definition,
                "result": result,
            }
        )

    except ValueError as error:
        return ErrorResponse({"error": str(error)})


def optimization_criteria(
    constants_vector: list[float],
    parameters: PIParameters,
    model: Model,
    variables_datatable: VariablesDatatable,
) -> float:
    """Optimization criteria"""

    time: float = max(
        [max([value.time for value in values.values]) for values in parameters.data]
    )
    time_step: float = time / parameters.nodes_amount

    variables_datatable.update_constants(
        {
            constant.name: Values(
                {
                    "name": constant.name,
                    "values": [{"time": 0, "value": constants_vector[i]}],
                },
                ApproximationType.PIECEWISE_CONSTANT,
            )
            for i, constant in enumerate(parameters.selected_constants)
        }
    )

    variables_datatable.update_interventions(
        {
            intervention.name: Values(
                {
                    "name": intervention.name,
                    "values": next(
                        (
                            values.values
                            for values in parameters.data
                            if intervention.name == values.name
                        ),
                        [],
                    ),
                },
            )
            for intervention in model.interventions
        }
    )

    model.simulate(time_step, parameters.nodes_amount, variables_datatable, True)

    return calculate_objective(
        parameters.data,
        variables_datatable.compartments,
    )


def calculate_objective(
    known_data: list[Values],
    simulated_data: dict[str, Values],
) -> float:
    """Cost function"""

    cost: float = 0

    for known_values in known_data:
        simulated_values: Values = simulated_data[known_values.name]

        for value in known_values.values:
            cost += (value.value - simulated_values(value.time)) ** 2

    return cost
