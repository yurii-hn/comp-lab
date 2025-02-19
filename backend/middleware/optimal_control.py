"""Optimal Control Middleware"""

from typing import cast

from core.classes.common.error_response import ErrorResponse
from core.classes.common.values import Values
from core.classes.model.equation import Equation
from core.classes.model.model import Model
from core.classes.model.variables_datatable import VariablesDatatable
from core.classes.optimal_control.adjoint_model import AdjointModel
from core.classes.optimal_control.parameters import OptimalControlParameters
from core.classes.optimal_control.success_response import \
    OptimalControlSuccessResponse
from core.definitions.common.approximation_type import ApproximationType
from core.definitions.model.continuity_type import ContinuityType
from core.definitions.optimal_control.result import \
    OptimalControlResultDefinition
from core.definitions.simulation.result import SimulationResultDefinition
from scipy.optimize import OptimizeResult, minimize
from sympy import Interval, Symbol, oo


def optimal_control(
    parameters: OptimalControlParameters, model: Model
) -> OptimalControlSuccessResponse | ErrorResponse:
    """Optimal Control"""

    for compartment in model.compartments:
        continuity_status: dict[str, ContinuityType] = {
            **{
                str(symbol): compartment.equation.check_continuity(
                    symbol, Interval(0, oo), True
                )
                for symbol in model.compartments_symbols
            },
            **{
                str(symbol): compartment.equation.check_continuity(
                    symbol,
                    Interval(
                        *next(
                            [
                                boundary.lower_boundary,
                                boundary.upper_boundary,
                            ]
                            for boundary in parameters.intervention.boundaries
                            if boundary.name == str(symbol)
                        )
                    ),
                    True,
                )
                for symbol in model.interventions_symbols
            },
        }

        if not all(
            [
                continuity_type == ContinuityType.CONTINUOUSLY_DIFFERENTIABLE
                for continuity_type in continuity_status.values()
            ]
        ):
            discontinuous_symbols: list[str] = [
                symbol
                for symbol, continuity_type in continuity_status.items()
                if continuity_type == ContinuityType.DISCONTINUOUS
            ]
            continuous_symbols: list[str] = [
                symbol
                for symbol, continuity_type in continuity_status.items()
                if continuity_type == ContinuityType.CONTINUOUS
            ]

            return ErrorResponse(
                {
                    "error": f"Equation of {compartment.name} is discontinuous by:\n"
                    + ", ".join(discontinuous_symbols)
                    + "\nand only continuous by:\n"
                    + ", ".join(continuous_symbols)
                }
            )

    if not model.population_preserved:
        return ErrorResponse(
            {
                "error": "Model equations do not preserve population\n\n"
                + "Apparently that is result of a program bug. Please reload the page and try again",
            }
        )

    cost_function: Equation = Equation()

    cost_function.add_str(parameters.objective_function, model.symbols_table)

    cost_function.substitute(
        [(constant.symbol, constant.value) for constant in model.constants]
    )

    continuity_status: dict[str, ContinuityType] = {
        **{
            str(symbol): cost_function.check_continuity(symbol, Interval(0, oo), True)
            for symbol in model.compartments_symbols
        },
        **{
            str(symbol): cost_function.check_continuity(
                symbol,
                Interval(
                    *next(
                        [
                            boundary.lower_boundary,
                            boundary.upper_boundary,
                        ]
                        for boundary in parameters.intervention.boundaries
                        if boundary.name == str(symbol)
                    )
                ),
                True,
            )
            for symbol in model.interventions_symbols
        },
    }

    if not all(
        [
            continuity_type == ContinuityType.CONTINUOUSLY_DIFFERENTIABLE
            for continuity_type in continuity_status.values()
        ]
    ):
        discontinuous_symbols: list[str] = [
            symbol
            for symbol, continuity_type in continuity_status.items()
            if continuity_type == ContinuityType.DISCONTINUOUS
        ]
        continuous_symbols: list[str] = [
            symbol
            for symbol, continuity_type in continuity_status.items()
            if continuity_type == ContinuityType.CONTINUOUS
        ]

        return ErrorResponse(
            {
                "error": "Equation of cost function is discontinuous by:\n"
                + ", ".join(discontinuous_symbols)
                + "\nand only continuous by:\n"
                + ", ".join(continuous_symbols)
            }
        )

    hamiltonian: Equation = Equation()

    hamiltonian.add(cost_function.expression)

    for compartment in model.compartments:
        hamiltonian.add(
            Symbol(f"lambda_{compartment.name}")
            * compartment.equation.expression  # type: ignore
        )

    adjoint_model: AdjointModel = AdjointModel(
        model.compartments_symbols,
        hamiltonian,
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

        no_control_result: SimulationResultDefinition = {
            "compartments": variables_datatable.compartments_definition
        }

        no_control_cost: float = cost_function.calculate_interval(
            parameters.time / parameters.nodes_amount,
            parameters.nodes_amount,
            variables_datatable,
        )

        if (
            parameters.intervention.approximation_type
            == ApproximationType.PIECEWISE_LINEAR
        ):
            parameters.intervention.nodes_amount += 1

        optimal_result: OptimizeResult = cast(
            OptimizeResult,
            minimize(
                optimization_criteria,
                [0] * parameters.intervention.nodes_amount * len(model.interventions),
                args=(
                    parameters,
                    hamiltonian,
                    model,
                    adjoint_model,
                    variables_datatable,
                ),
                bounds=[
                    boundary
                    for boundaries in [
                        [
                            next(
                                (
                                    boundary.lower_boundary,
                                    boundary.upper_boundary,
                                )
                                for boundary in parameters.intervention.boundaries
                                if boundary.name == intervention.name
                            )
                        ]
                        * parameters.intervention.nodes_amount
                        for intervention in model.interventions
                    ]
                    for boundary in boundaries
                ],
                method="L-BFGS-B",
                tol=1e-3,
            ),
        )

        optimal_cost: float = cost_function.calculate_interval(
            parameters.time / parameters.nodes_amount,
            parameters.nodes_amount,
            variables_datatable,
        )

        if (
            parameters.intervention.approximation_type
            == ApproximationType.PIECEWISE_LINEAR
        ):
            parameters.intervention.nodes_amount -= 1

        result: OptimalControlResultDefinition = {
            "compartments": variables_datatable.compartments_definition,
            "interventions": [
                {
                    "name": intervention.name,
                    "values": [
                        {
                            "time": j
                            * parameters.time
                            / parameters.intervention.nodes_amount,
                            "value": value,
                        }
                        for j, value in enumerate(
                            optimal_result.x[
                                i
                                * parameters.intervention.nodes_amount : (i + 1)
                                * parameters.intervention.nodes_amount
                            ]
                        )
                    ],
                }
                for i, intervention in enumerate(model.interventions)
            ],
            "approximatedInterventions": variables_datatable.interventions_definition,
            "noControlObjective": no_control_cost,
            "optimalObjective": optimal_cost,
        }

        return OptimalControlSuccessResponse(
            {
                "parameters": parameters.definition,
                "model": model.definition,
                "result": (no_control_result, result),
            },
            parameters.intervention.approximation_type,
        )

    except ValueError as error:
        return ErrorResponse({"error": str(error)})


def optimization_criteria(
    interventions_vector: list[float],
    parameters: OptimalControlParameters,
    hamiltonian: Equation,
    model: Model,
    adjoint_model: AdjointModel,
    variables_datatable: VariablesDatatable,
) -> float:
    """Optimization criteria"""

    step_size: float = parameters.time / parameters.nodes_amount

    variables_datatable.update_interventions(
        {
            intervention.name: Values(
                {
                    "name": intervention.name,
                    "values": [
                        {
                            "time": j
                            * parameters.time
                            / parameters.intervention.nodes_amount,
                            "value": value,
                        }
                        for j, value in enumerate(
                            interventions_vector[
                                i
                                * parameters.intervention.nodes_amount : (i + 1)
                                * parameters.intervention.nodes_amount
                            ]
                        )
                    ],
                },
                parameters.intervention.approximation_type,
            )
            for i, intervention in enumerate(model.interventions)
        }
    )

    model.simulate(step_size, parameters.nodes_amount, variables_datatable, True)

    adjoint_model.simulate(step_size, parameters.nodes_amount, variables_datatable)

    return hamiltonian.calculate_interval(
        step_size, parameters.nodes_amount, variables_datatable
    )
