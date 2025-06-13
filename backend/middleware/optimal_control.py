import numpy as np
import numpy.typing as npt
import sympy as sp

from classes.common.error_response import ErrorResponse
from classes.common.values import Values
from classes.model.continuity_type import ContinuityType
from classes.model.equation import Equation
from classes.model.runtime_compartment import RuntimeCompartment
from classes.model.runtime_model import RuntimeModel
from classes.model.datatable import Datatable
from classes.model.model import Model
from classes.common.approximation_type import ApproximationType
from classes.optimal_control.intervention_boundaries import InterventionBoundaries
from classes.optimal_control.intervention_parameters import InterventionParameters
from classes.optimal_control.parameters import OptimalControlParameters
from classes.optimal_control.result import OptimalControlResult
from classes.optimal_control.success_response import OptimalControlSuccessResponse
from classes.simulation.result import SimulationResult
from classes.optimal_control.adjoint_model import AdjointModel
from functions.is_population_preserved import is_population_preserved
from functions.model_to_runtime_model import model_to_runtime_model
from functions.simulate import simulate
from functions.simulate_adjoint import simulate_adjoint


def optimal_control(
    parameters: OptimalControlParameters, model: Model
) -> OptimalControlSuccessResponse | ErrorResponse:
    try:
        runtime_model: RuntimeModel = model_to_runtime_model(model)
        cost_function: Equation = get_cost_function(
            parameters["objectiveFunction"],
            [
                *[compartment for compartment in runtime_model["compartments"]],
                *[constant["name"] for constant in runtime_model["constants"]],
                *[
                    intervention["name"]
                    for intervention in runtime_model["interventions"]
                ],
            ],
        )

        validate_model(runtime_model, parameters["intervention"]["boundaries"])
        validate_cost_function(
            cost_function, runtime_model, parameters["intervention"]["boundaries"]
        )

        hamiltonian: Equation = get_hamiltonian(
            cost_function, runtime_model["compartments"]
        )
        adjoint_model: AdjointModel = hamiltonian_to_adjoint_model(
            hamiltonian, list(runtime_model["compartments"].keys())
        )
        hamiltonian_intervention_partials: dict[str, Equation] = (
            get_hamiltonian_intervention_partials(
                hamiltonian,
                [
                    intervention["name"]
                    for intervention in runtime_model["interventions"]
                ],
            )
        )

        times: npt.NDArray[np.float64] = np.linspace(
            0,
            parameters["time"],
            parameters["nodesAmount"] + 1,
            dtype=np.float64,
        )
        intervention_times: npt.NDArray[np.float64] = np.linspace(
            0,
            parameters["time"],
            parameters["intervention"]["nodesAmount"] + 1,
            dtype=np.float64,
        )
        variables_datatable: Datatable = Datatable()

        variables_datatable.set_constants(
            {
                constant["name"]: Values(
                    times,
                    np.repeat(constant["value"], times.size),
                    ApproximationType.PIECEWISE_CONSTANT,
                )
                for constant in runtime_model["constants"]
            }
        )
        variables_datatable.set_interventions(
            {
                intervention["name"]: Values(
                    intervention_times,
                    np.zeros(intervention_times.size),
                    ApproximationType.PIECEWISE_CONSTANT,
                )
                for intervention in runtime_model["interventions"]
            }
        )

        simulate(runtime_model, times, variables_datatable)

        no_control_cost: np.float64 = cost_function.calculate_interval(
            times, variables_datatable
        )
        no_control_result: SimulationResult = {
            "compartments": variables_datatable.compartments_data,
        }

        optimal_cost: np.float64 = no_control_cost
        previous_interventions: dict[str, Values] = {}
        current_interventions: dict[str, Values] = variables_datatable.interventions

        for _ in range(int(1e2)):
            simulate_adjoint(adjoint_model, intervention_times, variables_datatable)

            update_interventions(
                hamiltonian_intervention_partials,
                intervention_times,
                parameters["intervention"],
                variables_datatable,
            )

            simulate(runtime_model, times, variables_datatable)

            optimal_cost = cost_function.calculate_interval(times, variables_datatable)
            previous_interventions = current_interventions
            current_interventions = variables_datatable.interventions

            if (
                np.max(
                    [
                        np.linalg.norm(
                            current_interventions[intervention].values
                            - previous_interventions[intervention].values,
                            ord=2,
                        )
                        for intervention in current_interventions
                    ]
                )
                < 1e-4
            ):
                break

        optimal_result: OptimalControlResult = {
            "compartments": variables_datatable.compartments_data,
            "interventions": variables_datatable.interventions_data,
            "noControlObjective": no_control_cost,
            "optimalObjective": optimal_cost,
        }

        return {
            "type": "OptimalControl",
            "parameters": parameters,
            "model": model,
            "result": (no_control_result, optimal_result),
        }

    except RuntimeError as error:
        return ErrorResponse(
            {
                "error": str(error),
            }
        )

    except Exception as error:
        print(error)

        return ErrorResponse(
            {
                "error": "There is an error in the back end",
            }
        )


def update_interventions(
    hamiltonian_intervention_partials: dict[str, Equation],
    times: npt.NDArray[np.float64],
    intervention_parameters: InterventionParameters,
    variables_datatable: Datatable,
) -> None:
    THETA = 0.5

    new_values: dict[str, Values] = {}

    for intervention_name, equation in hamiltonian_intervention_partials.items():
        boundaries: InterventionBoundaries = intervention_parameters["boundaries"][
            intervention_name
        ]

        update_solution: list[sp.Expr] = sp.solve(
            equation.expression, intervention_name
        )

        if len(update_solution):
            update_equation: Equation = Equation()

            update_equation.add(update_solution[0])

            updated_values: npt.NDArray[np.float64] = np.clip(
                update_equation.calculate(
                    [
                        variables_datatable[variable.name](times)
                        for variable in update_equation.variables
                    ]
                ),
                boundaries["lowerBoundary"],
                boundaries["upperBoundary"],
            )

            new_values[intervention_name] = Values(
                times,
                THETA * updated_values
                + (1 - THETA) * variables_datatable[intervention_name](times),
                intervention_parameters["approximationType"],
            )
        else:
            derivative_values = equation.calculate(
                [
                    variables_datatable[variable.name](times)
                    for variable in equation.variables
                ]
            )

            new_values[intervention_name] = Values(
                times,
                np.where(
                    derivative_values > 0,
                    boundaries["lowerBoundary"],
                    boundaries["upperBoundary"],
                ),
                intervention_parameters["approximationType"],
            )

    variables_datatable.set_interventions(new_values)


def validate_model(
    runtime_model: RuntimeModel,
    intervention_boundaries: dict[str, InterventionBoundaries],
) -> None:
    constant_names: list[str] = [
        constant["name"] for constant in runtime_model["constants"]
    ]

    for compartment in runtime_model["compartments"].values():
        continuity_status: dict[str, ContinuityType] = {
            **{
                name: compartment["equation"].check_continuity(
                    name, sp.Interval(0, sp.oo), True
                )
                for name in runtime_model["compartments"]
            },
            **{
                intervention["name"]: compartment["equation"].check_continuity(
                    intervention["name"],
                    sp.Interval(
                        intervention_boundaries[intervention["name"]]["lowerBoundary"],
                        intervention_boundaries[intervention["name"]]["upperBoundary"],
                    ),
                    True,
                )
                for intervention in runtime_model["interventions"]
            },
            **{
                constant["name"]: compartment["equation"].check_continuity(
                    constant["name"],
                    sp.Interval(constant["value"], constant["value"]),
                )
                for constant in runtime_model["constants"]
            },
        }

        if not all(
            [
                (
                    continuity_type == ContinuityType.CONTINUOUS
                    if variable in constant_names
                    else continuity_type == ContinuityType.CONTINUOUSLY_DIFFERENTIABLE
                )
                for variable, continuity_type in continuity_status.items()
            ]
        ):
            discontinuous_variables: list[str] = [
                variable
                for variable, continuity_type in continuity_status.items()
                if continuity_type == ContinuityType.DISCONTINUOUS
            ]
            continuous_variables: list[str] = [
                variable
                for variable, continuity_type in continuity_status.items()
                if continuity_type == ContinuityType.CONTINUOUS
            ]

            raise RuntimeError(
                f"Equation of {compartment["name"]} is"
                + (
                    f"\nDiscontinuous by: {", ".join(discontinuous_variables)}"
                    if len(discontinuous_variables)
                    else ""
                )
                + (
                    f"\nOnly continuous by: {", ".join(continuous_variables)}"
                    if len(continuous_variables)
                    else ""
                )
            )

    if not is_population_preserved(runtime_model):
        raise RuntimeError(
            "Model equations do not preserve population\n\n"
            + "Apparently that is result of a program bug. Please reload the page and try again",
        )


def get_cost_function(
    objective_function: str,
    variables: list[str],
) -> Equation:
    cost_function: Equation = Equation()

    cost_function.add_str(
        objective_function,
        variables,
    )

    return cost_function


def validate_cost_function(
    cost_function: Equation,
    runtime_model: RuntimeModel,
    intervention_boundaries: dict[str, InterventionBoundaries],
) -> None:
    constant_names: list[str] = [
        constant["name"] for constant in runtime_model["constants"]
    ]

    continuity_status: dict[str, ContinuityType] = {
        **{
            name: cost_function.check_continuity(
                name,
                sp.Interval(0, sp.oo),
                True,
            )
            for name in runtime_model["compartments"]
        },
        **{
            intervention["name"]: cost_function.check_continuity(
                intervention["name"],
                sp.Interval(
                    intervention_boundaries[intervention["name"]]["lowerBoundary"],
                    intervention_boundaries[intervention["name"]]["upperBoundary"],
                ),
                True,
            )
            for intervention in runtime_model["interventions"]
        },
        **{
            constant["name"]: cost_function.check_continuity(
                constant["name"],
                sp.Interval(constant["value"], constant["value"]),
            )
            for constant in runtime_model["constants"]
        },
    }

    if not all(
        [
            (
                continuity_type == ContinuityType.CONTINUOUS
                if variable in constant_names
                else continuity_type == ContinuityType.CONTINUOUSLY_DIFFERENTIABLE
            )
            for variable, continuity_type in continuity_status.items()
        ]
    ):
        discontinuous_variables: list[str] = [
            variable
            for variable, continuity_type in continuity_status.items()
            if continuity_type == ContinuityType.DISCONTINUOUS
        ]
        continuous_variables: list[str] = [
            variable
            for variable, continuity_type in continuity_status.items()
            if continuity_type == ContinuityType.CONTINUOUS
        ]

        raise RuntimeError(
            "Equation of cost function is"
            + (
                f"\nDiscontinuous by: {", ".join(discontinuous_variables)}"
                if len(discontinuous_variables)
                else ""
            )
            + (
                f"\nOnly continuous by: {", ".join(continuous_variables)}"
                if len(continuous_variables)
                else ""
            )
        )


def get_hamiltonian(
    cost_function: Equation,
    compartments: dict[str, RuntimeCompartment],
) -> Equation:
    hamiltonian: Equation = Equation()

    hamiltonian.add(cost_function.expression)

    for name, compartment in compartments.items():
        hamiltonian.add(
            sp.Symbol(f"lambda_{name}")
            * compartment["equation"].expression  # type: ignore
        )

    return hamiltonian


def hamiltonian_to_adjoint_model(
    hamiltonian: Equation,
    compartments: list[str],
) -> AdjointModel:
    lambdas: dict[str, Equation] = {}

    for compartment in compartments:
        symbol: sp.Symbol = sp.Symbol(f"lambda_{compartment}")
        equation: Equation = Equation()

        equation.add(-hamiltonian.expression.diff(sp.Symbol(compartment)))

        lambdas[symbol.name] = equation

    return {"lambdas": lambdas}


def get_hamiltonian_intervention_partials(
    hamiltonian: Equation, interventions: list[str]
) -> dict[str, Equation]:
    partials: dict[str, Equation] = {}

    for intervention in interventions:
        symbol: sp.Symbol = sp.Symbol(intervention)
        equation: Equation = Equation()

        equation.add(hamiltonian.expression.diff(symbol))

        partials[symbol.name] = equation

    return partials
