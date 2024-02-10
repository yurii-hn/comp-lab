"""
Optimal control module

This module contains the optimal control logic
"""

from typing import List, Tuple, cast, Set
from scipy.optimize import minimize
from sympy import Symbol, Interval, oo, Expr, diff, lambdify

from definitions import (
    ISymbolsTable,
    IVariablesDatatable,
    IEquation,
    IIntervention,
    ISimulationCompartment,
    ISimulationLambda,
    IRequestOptimalControlParameters,
    IOptimalControlRequestData,
    IInterventionResponseData,
    ILambdaResponseData,
    ISimulationResponsePayload,
    IOptimalControlResponsePayload,
    IOptimalControlSuccessResponse,
    IOptimalControlErrorResponse,
    IOptimalControlResponse,
    ContinuityType,
    IContinuityCheckResult,
    IResponseOptimalControlParameters,
    ICompartmentResponseData,
    InterventionApproximationType
)
from shared import (
    get_equation,
    get_compartment_equation,
    check_continuity,
    is_population_preserved,
    simulate_model,
)


def optimal_control(data: IOptimalControlRequestData) -> IOptimalControlResponse:
    """
    Optimal control

    This function is used for solving the optimal control problem

    Parameters
    ----------
    data : IOptimalControlRequestData
        Optimal control request data

    Returns
    -------
    IOptimalControlResponse
        Optimal control response

    Raises
    ------
    ValueError
        If there is an error in the optimization process
    """

    symbols_table: ISymbolsTable = ISymbolsTable({
        compartment.name: Symbol(compartment.name)
        for compartment in data.payload.compartments
    })
    simulation_model: List[ISimulationCompartment] = []
    simulation_lambdas_derivatives: List[ISimulationLambda] = []

    for compartment in data.payload.compartments:
        simulation_compartment: ISimulationCompartment = ISimulationCompartment(
            compartment.name,
            compartment.value,
            get_compartment_equation(compartment, symbols_table)
        )

        continuity_type: IContinuityCheckResult = check_continuity(
            simulation_compartment.equation.symbolic_equation,
            symbols_table,
            Interval(0, oo),
            True
        )

        if continuity_type.type == ContinuityType.DISCONTINUOUS:
            return IOptimalControlErrorResponse(
                f'Equation of {compartment.name} is discontinuous by {continuity_type.discontinuity_symbol}',
                False
            )
        elif continuity_type.type == ContinuityType.CONTINUOUS:
            return IOptimalControlErrorResponse(
                f'Equation derivative for {compartment.name} is not continuous by {continuity_type.discontinuity_symbol}',
                False
            )

        simulation_model.append(simulation_compartment)

    if not is_population_preserved(
        [compartment.equation.symbolic_equation for compartment in simulation_model]
    ):
        return IOptimalControlErrorResponse(
            'Model equations do not preserve population' +
            'Apparently that is result of a program bug. Please reload the page and try again',
            False
        )

    for intervention in data.payload.interventions:
        symbols_table[intervention.name] = Symbol(intervention.name)

    cost_function: IEquation = get_equation(
        data.parameters.cost_function,
        symbols_table
    )

    cost_function_continuity_check_result: IContinuityCheckResult = check_continuity(
        cost_function.symbolic_equation,
        symbols_table,
        derivative=True
    )

    if cost_function_continuity_check_result.type == ContinuityType.DISCONTINUOUS:
        return IOptimalControlErrorResponse(
            f'Equation for cost function is not continuous by {cost_function_continuity_check_result.discontinuity_symbol}',
            False
        )
    elif cost_function_continuity_check_result.type == ContinuityType.CONTINUOUS:
        return IOptimalControlErrorResponse(
            f'Equation for cost function derivative is not continuous by {cost_function_continuity_check_result.discontinuity_symbol}',
            False
        )

    hamiltonian: IEquation = get_hamiltonian_equation(
        simulation_model,
        cost_function
    )

    for i, compartment in enumerate(simulation_model):
        simulation_lambdas_derivatives.append(
            ISimulationLambda(
                'lambda' + str(i),
                get_lambda_derivative(
                    hamiltonian.symbolic_equation,
                    symbols_table[compartment.name]
                )
            )
        )

    try:
        variables_datatable: List[IVariablesDatatable] = [
            IVariablesDatatable({
                **{
                    compartment.name: [compartment.value] + [0] * (
                        data.parameters.nodes_amount
                    )
                    for compartment in simulation_model
                },
                **{
                    intervention.name: [0] *
                    (data.parameters.nodes_amount + 1)
                    for intervention in data.payload.interventions
                },
                **{
                    current_lambda.name: [0] *
                    (data.parameters.nodes_amount + 1)
                    for current_lambda in simulation_lambdas_derivatives
                }
            })
        ]

        no_control_simulation_results: List[ICompartmentResponseData] = simulate_model(
            simulation_model,
            data.parameters,
            variables_datatable[0]
        )

        start_cost: float = calculate_cost(
            cost_function,
            data.parameters,
            variables_datatable[0]
        )

        simulation_results: List[List[ICompartmentResponseData]] = [
            cast(
                List[ICompartmentResponseData],
                []
            ),
        ]

        if data.parameters.intervention_approximation_type == InterventionApproximationType.PIECEWISE_LINEAR.value:
            data.parameters.intervention_nodes_amount += 1

        minimize_result = minimize(
            optimization_criteria,
            [0] * data.parameters.intervention_nodes_amount *
            len(data.payload.interventions),
            args=(
                simulation_model,
                simulation_lambdas_derivatives,
                data.payload.interventions,
                hamiltonian,
                data.parameters,
                variables_datatable,
                simulation_results
            ),
            bounds=[
                (
                    data.parameters.intervention_lower_boundary,
                    data.parameters.intervention_upper_boundary
                )
                for i in range(data.parameters.intervention_nodes_amount)
            ] * len(data.payload.interventions),
            tol=1e-3
        )

        optimized_cost: float = calculate_cost(
            cost_function,
            data.parameters,
            variables_datatable[0]
        )

        interventions_values: List[IInterventionResponseData] = [
            IInterventionResponseData(
                intervention.name,
                list(
                    minimize_result.x[
                        i * data.parameters.intervention_nodes_amount:
                        (i + 1) * data.parameters.intervention_nodes_amount
                    ]
                ) + (
                    [0]
                    if data.parameters.intervention_approximation_type == InterventionApproximationType.PIECEWISE_CONSTANT.value
                    else []
                )
            )
            for i, intervention in enumerate(data.payload.interventions)
        ]

        return IOptimalControlSuccessResponse(
            IResponseOptimalControlParameters(
                data.parameters.time,
                data.parameters.nodes_amount,
                data.parameters.cost_function,
                data.parameters.intervention_nodes_amount,
                data.parameters.intervention_upper_boundary,
                data.parameters.intervention_lower_boundary,
                data.parameters.intervention_approximation_type
            ),
            (
                ISimulationResponsePayload(
                    no_control_simulation_results
                ),
                IOptimalControlResponsePayload(
                    simulation_results[0],
                    interventions_values,
                )
            ),
            True
        )

    except ValueError as e:
        return IOptimalControlErrorResponse(
            str(e),
            False
        )


def optimization_criteria(
    interventions_vector: List[float],
    simulation_model: List[ISimulationCompartment],
    simulation_lambdas_derivatives: List[ISimulationLambda],
    interventions: List[IIntervention],
    hamiltonian: IEquation,
    parameters: IRequestOptimalControlParameters,
    variables_datatable: List[IVariablesDatatable],
    simulation_results: List[List[ICompartmentResponseData]]
) -> float:
    """
    Optimization criteria

    This function is used for the optimization criteria

    Parameters
    ----------
    interventions_vector : List[float]
        Interventions vector
    simulation_model : List[ISimulationCompartment]
        Simulation model
    simulation_lambdas_derivatives : List[ISimulationLambda]
        Simulation lambdas derivatives
    interventions : List[IIntervention]
        Interventions
    hamiltonian : IEquation
        Hamiltonian
    parameters : IRequestOptimalControlParameters
        Optimal control parameters
    variables_datatable : Tuple[IVariablesDatatable]
        Variables datatable
    simulation_results : Tuple[List[ICompartmentResponseData]]
        Simulation results

    Returns
    -------
    float
        Optimization criteria value
    """
    step_size: float = parameters.time / \
        parameters.nodes_amount

    approximation_function = (
        piecewise_constant_control_approximation
        if parameters.intervention_approximation_type == InterventionApproximationType.PIECEWISE_CONSTANT.value
        else piecewise_linear_control_approximation
    )

    variables_datatable[0] = IVariablesDatatable({
        **{
            compartment.name: [compartment.value] + [0] *
            parameters.nodes_amount
            for compartment in simulation_model
        },
        **{
            intervention.name: [
                approximation_function(
                    j * step_size,
                    interventions_vector[
                        i * parameters.intervention_nodes_amount:
                        (i + 1) * parameters.intervention_nodes_amount
                    ],
                    parameters.time
                )
                for j in range(parameters.nodes_amount + 1)
            ]
            for i, intervention in enumerate(interventions)
        },
        **{
            current_lambda.name: [0] * (parameters.nodes_amount + 1)
            for current_lambda in simulation_lambdas_derivatives
        }
    })

    simulation_results[0] = simulate_model(
        simulation_model,
        parameters,
        variables_datatable[0]
    )

    get_lambda_values(
        simulation_lambdas_derivatives,
        parameters,
        variables_datatable[0]
    )

    return calculate_hamiltonian(
        hamiltonian,
        parameters,
        variables_datatable[0]
    )


def piecewise_constant_control_approximation(
    t: float,
    interventions_vector: List[float],
    simulation_time: float,
) -> float:
    """
    Constant control approximation

    This function returns the constant control approximation

    Parameters
    ----------
    t : float
        Time
    interventions_vector : List[float]
        Interventions vector
    simulation_time : float
        Simulation time

    Returns
    -------
    float
        Constant control approximation
    """

    if t >= simulation_time:
        return interventions_vector[-1]

    intervention_nodes_step: float = simulation_time / \
        len(interventions_vector)

    return interventions_vector[
        int(t / intervention_nodes_step)
    ]


def piecewise_linear_control_approximation(
    t: float,
    interventions_vector: List[float],
    simulation_time: float,
) -> float:
    """
    Linear control approximation

    This function returns the linear control approximation

    Parameters
    ----------
    t : float
        Time
    interventions_vector : List[float]
        Interventions vector
    simulation_time : float
        Simulation time

    Returns
    -------
    float
        Linear control approximation
    """

    if t >= simulation_time:
        return interventions_vector[-1]

    intervention_nodes_step: float = simulation_time / \
        (len(interventions_vector) - 1)

    i: int = int(t / intervention_nodes_step)

    t_right: float = (i + 1) * intervention_nodes_step
    t_left: float = i * intervention_nodes_step

    return (
        (t_right - t) / (t_right - t_left) * interventions_vector[i] +
        (t - t_left) / (t_right - t_left) * interventions_vector[i + 1]
    )


def get_hamiltonian_equation(
    model: List[ISimulationCompartment],
    cost_function: IEquation
) -> IEquation:
    """Get the hamiltonian equation"""
    hamiltonian_equation: Expr = cost_function.symbolic_equation

    for i, compartment in enumerate(model):
        hamiltonian_equation += Symbol('lambda' + str(i)) * \
            compartment.equation.symbolic_equation  # type: ignore

    return IEquation(
        list(
            cast(
                Set[Symbol],
                hamiltonian_equation.free_symbols
            )
        ),
        lambdify(
            list(hamiltonian_equation.free_symbols),
            hamiltonian_equation
        ),
        hamiltonian_equation,
    )


def get_lambda_derivative(hamiltonian: Expr, compartment: Symbol) -> IEquation:
    """Get the lambda derivative"""
    lambda_derivative_symbolic_equation: Expr = - diff(
        hamiltonian,
        compartment
    )

    return IEquation(
        list(
            cast(
                Set[Symbol],
                lambda_derivative_symbolic_equation.free_symbols
            )
        ),
        lambdify(
            list(lambda_derivative_symbolic_equation.free_symbols),
            lambda_derivative_symbolic_equation
        ),
        lambda_derivative_symbolic_equation,
    )


def calculate_cost(
    cost_function: IEquation,
    parameters: IRequestOptimalControlParameters,
    variables_datatable: IVariablesDatatable
) -> float:
    """Cost function"""
    step_size: float = parameters.time / \
        parameters.nodes_amount
    cost: float = 0

    for i in range(parameters.nodes_amount + 1):
        values: List[float] = [
            variables_datatable[str(var)][i]
            for var in cost_function.vars
        ]

        cost += cost_function.equation_function(*values) * \
            step_size

    return cost


def calculate_hamiltonian(
    hamiltonian: IEquation,
    parameters: IRequestOptimalControlParameters,
    variables_datatable: IVariablesDatatable
) -> float:
    """Hamiltonian function"""
    step_size: float = parameters.time / \
        parameters.nodes_amount
    value: float = 0

    for i in range(parameters.nodes_amount + 1):
        values: List[float] = [
            variables_datatable[str(var)][i]
            for var in hamiltonian.vars
        ]

        value += hamiltonian.equation_function(*values) * \
            step_size

    return value


def get_lambda_values(
    lambdas: List[ISimulationLambda],
    parameters: IRequestOptimalControlParameters,
    variables_datatable: IVariablesDatatable,
) -> List[ILambdaResponseData]:
    """Get lambda values"""
    step_size: float = parameters.time / \
        parameters.nodes_amount

    for i in range(
        parameters.nodes_amount - 1,
        -1,
        -1
    ):
        for current_lambda in lambdas:
            values: List[float] = [
                variables_datatable[str(var)][i + 1]
                for var in current_lambda.derivative_equation.vars
            ]

            variables_datatable[current_lambda.name][i] = (
                variables_datatable[current_lambda.name][i + 1] -
                current_lambda.derivative_equation.equation_function(*values) *
                step_size
            )

    lambdas_values: List[ILambdaResponseData] = [
        ILambdaResponseData(
            current_lambda.name,
            variables_datatable[current_lambda.name]
        )
        for current_lambda in lambdas
    ]

    return lambdas_values
