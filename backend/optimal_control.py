"""
Optimal control module

This module contains the optimal control logic
"""

from typing import List, Tuple
from scipy.optimize import minimize
from sympy import Symbol, Interval, oo, Expr, diff, lambdify

from definitions import (
    ISymbolsTable,
    IVariablesDatatable,
    IEquation,
    IIntervention,
    ISimulationCompartment,
    ISimulationLambda,
    ISimulationParameters,
    IOptimalControlData,
    ICompartmentSimulatedData,
    IInterventionSimulatedData,
    ILambdaSimulatedData,
    IOptimalControlSuccessResponse,
    IErrorResponse,
    ContinuityType,
    IContinuityCheckResult,
)
from shared import (
    get_equation,
    get_compartment_equation,
    check_continuity,
    is_population_preserved,
    simulate_model,
)


def optimal_control(payload: IOptimalControlData) -> (
    IOptimalControlSuccessResponse | IErrorResponse
):
    """
    Optimal control solver

    This function solves the optimal control problem

    Parameters
    ----------
    payload : IOptimalControlData
        Payload

    Returns
    -------
    ISimulationResultsSuccess | ISimulationResultsError
        Simulation results
    """

    optimization_parameters_amount: int = 16

    symbols_table: ISymbolsTable = {
        compartment.name: Symbol(compartment.name)
        for compartment in payload.model
    }
    simulation_model: List[ISimulationCompartment] = []
    simulation_lambdas_derivatives: List[ISimulationLambda] = []

    for compartment in payload.model:
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
            return {
                'error': f'Equation of {compartment.name} is discontinuous by {continuity_type.discontinuity_symbol}',
                'success': False
            }
        elif continuity_type.type == ContinuityType.CONTINUOUS:
            return {
                'error': f'Equation derivative for {compartment.name} is not continuous by {continuity_type.discontinuity_symbol}',
                'success': False
            }

        simulation_model.append(simulation_compartment)

    if not is_population_preserved(
        [compartment.equation.symbolic_equation for compartment in simulation_model]
    ):
        return {
            'error': 'Model equations do not preserve population' +
            'Apparently that is result of a program bug. Please reload the page and try again',
            'success': False
        }

    for intervention in payload.interventions:
        symbols_table[intervention.name] = Symbol(intervention.name)

    cost_function: IEquation = get_equation(
        payload.cost_function,
        symbols_table
    )

    cost_function_continuity_check_result: IContinuityCheckResult = check_continuity(
        cost_function.symbolic_equation,
        symbols_table,
        derivative=True
    )

    if cost_function_continuity_check_result.type == ContinuityType.DISCONTINUOUS:
        return {
            'error': f'Equation for cost function is not continuous by {cost_function_continuity_check_result.discontinuity_symbol}',
            'success': False
        }
    elif cost_function_continuity_check_result.type == ContinuityType.CONTINUOUS:
        return {
            'error': f'Equation for cost function derivative is not continuous by {cost_function_continuity_check_result.discontinuity_symbol}',
            'success': False
        }

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
        variables_datatable: Tuple[IVariablesDatatable] = [
            {
                **{
                    compartment.name: [compartment.value] + [0] * (
                        int(
                            payload.simulation_parameters.time /
                            payload.simulation_parameters.step
                        ) - 1
                    )
                    for compartment in simulation_model
                },
                **{
                    intervention.name: [0] * int(
                        payload.simulation_parameters.time /
                        payload.simulation_parameters.step
                    )
                    for intervention in payload.interventions
                },
                **{
                    current_lambda.name: [0] * int(
                        payload.simulation_parameters.time /
                        payload.simulation_parameters.step
                    )
                    for current_lambda in simulation_lambdas_derivatives
                }
            }
        ]

        simulation_results: List[ICompartmentSimulatedData] = simulate_model(
            simulation_model,
            payload.simulation_parameters,
            variables_datatable[0]
        )

        start_cost: float = calculate_cost(
            cost_function,
            payload.simulation_parameters,
            variables_datatable[0]
        )

        simulation_results: Tuple[List[ICompartmentSimulatedData]] = [[]]

        minimize_result = minimize(
            optimization_criteria,
            [0] * optimization_parameters_amount * len(payload.interventions),
            args=(
                simulation_model,
                simulation_lambdas_derivatives,
                payload.interventions,
                hamiltonian,
                payload.simulation_parameters,
                optimization_parameters_amount,
                variables_datatable,
                simulation_results
            ),
            bounds=[
                (0, 1) for intervention in payload.interventions
            ] * optimization_parameters_amount,
            tol=1e-3
        )

        optimized_cost: float = calculate_cost(
            cost_function,
            payload.simulation_parameters,
            variables_datatable[0]
        )

        interventions_values: List[IInterventionSimulatedData] = [
            IInterventionSimulatedData(
                intervention.name,
                list(
                    minimize_result.x[
                        i * optimization_parameters_amount:
                        (i + 1) * optimization_parameters_amount
                    ]
                )
            )
            for i, intervention in enumerate(payload.interventions)
        ]

        print(start_cost, optimized_cost, start_cost - optimized_cost)

        return IOptimalControlSuccessResponse(
            payload.simulation_parameters.time,
            payload.simulation_parameters.step,
            simulation_results[0],
            interventions_values,
            True
        )

    except ValueError as e:
        return IErrorResponse(
            str(e),
            False
        )


def optimization_criteria(
    interventions_vector: List[float],
    simulation_model: List[ISimulationCompartment],
    simulation_lambdas_derivatives: List[ISimulationLambda],
    interventions: List[IIntervention],
    hamiltonian: IEquation,
    simulation_parameters: ISimulationParameters,
    optimization_parameters_amount: int,
    variables_datatable: Tuple[IVariablesDatatable],
    simulation_results: Tuple[List[ICompartmentSimulatedData]]
) -> float:
    """
    Optimization criteria

    This function is the optimization criteria

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
    simulation_parameters : ISimulationParameters
        Simulation parameters
    optimization_parameters_amount : int
        Optimization parameters amount
    variables_datatable : Tuple[IVariablesDatatable]
        Variables datatable
    simulation_results : Tuple[List[ICompartmentSimulatedData]]
        Simulation results

    Returns
    -------
    float
        Optimization result
    """
    simulation_nodes_amount: int = int(
        simulation_parameters.time /
        simulation_parameters.step
    )

    variables_datatable[0] = {
        **{
            compartment.name: [compartment.value] + [0] * (
                simulation_nodes_amount - 1
            )
            for compartment in simulation_model
        },
        **{
            intervention.name: [
                constant_control_approximation(
                    t,
                    interventions_vector[
                        i * optimization_parameters_amount:
                        (i + 1) * optimization_parameters_amount
                    ],
                    simulation_parameters.time
                )
                for t in range(simulation_nodes_amount)
            ]
            for i, intervention in enumerate(interventions)
        },
        **{
            current_lambda.name: [0] * simulation_nodes_amount
            for current_lambda in simulation_lambdas_derivatives
        }
    }

    simulation_results[0] = simulate_model(
        simulation_model,
        simulation_parameters,
        variables_datatable[0]
    )

    get_lambda_values(
        simulation_lambdas_derivatives,
        simulation_parameters,
        variables_datatable[0]
    )

    return calculate_hamiltonian(
        hamiltonian,
        simulation_parameters,
        variables_datatable[0]
    )


def constant_control_approximation(
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
    intervention_nodes_step: float = simulation_time / \
        len(interventions_vector)

    return interventions_vector[
        int(t / intervention_nodes_step)
    ]


def get_hamiltonian_equation(
    model: List[ISimulationCompartment],
    cost_function: IEquation
) -> IEquation:
    """Get the hamiltonian equation"""
    hamiltonian_equation: Expr = cost_function.symbolic_equation

    for i, compartment in enumerate(model):
        hamiltonian_equation += Symbol('lambda' + str(i)) * \
            compartment.equation.symbolic_equation

    return IEquation(
        list(hamiltonian_equation.free_symbols),
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
        list(lambda_derivative_symbolic_equation.free_symbols),
        lambdify(
            list(lambda_derivative_symbolic_equation.free_symbols),
            lambda_derivative_symbolic_equation
        ),
        lambda_derivative_symbolic_equation,
    )


def calculate_cost(
    cost_function: IEquation,
    simulation_parameters: ISimulationParameters,
    variables_datatable: IVariablesDatatable
) -> float:
    """Cost function"""
    cost: float = 0

    for t in range(int(simulation_parameters.time / simulation_parameters.step)):
        values: List[float] = [
            variables_datatable[str(var)][t]
            for var in cost_function.vars
        ]

        cost += cost_function.equation_function(*values)

    return cost


def calculate_hamiltonian(
    hamiltonian: IEquation,
    simulation_parameters: ISimulationParameters,
    variables_datatable: IVariablesDatatable
) -> float:
    """Hamiltonian function"""
    value: float = 0

    for t in range(int(simulation_parameters.time / simulation_parameters.step)):
        values: List[float] = [
            variables_datatable[str(var)][t]
            for var in hamiltonian.vars
        ]

        value += hamiltonian.equation_function(*values)

    return value


def get_lambda_values(
    lambdas: List[ISimulationLambda],
    simulation_parameters: ISimulationParameters,
    variables_datatable: IVariablesDatatable,
) -> List[ILambdaSimulatedData]:
    """Get lambda values"""
    for t in range(
        int(simulation_parameters.time / simulation_parameters.step - 2),
        -1,
        -1
    ):
        for current_lambda in lambdas:
            values: List[float] = [
                variables_datatable[str(var)][t + 1]
                for var in current_lambda.equation.vars
            ]

            variables_datatable[current_lambda.name][t] = (
                variables_datatable[current_lambda.name][t + 1] -
                current_lambda.equation.equation_function(*values)
            )

    lambdas_values: List[ILambdaSimulatedData] = [
        ILambdaSimulatedData(
            current_lambda.name,
            variables_datatable[current_lambda.name]
        )
        for current_lambda in lambdas
    ]

    return lambdas_values
