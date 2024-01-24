"""
Optimal control module

This module contains the optimal control logic
"""

from typing import List
from sympy import Symbol, Interval, oo

from definitions import (
    ISymbolsTable,
    IVariablesDatatable,
    IEquation,
    ISimulationCompartment,
    ISimulationIntervention,
    ISimulationLambda,
    IOptimalControlData,
    ICompartmentSimulatedData,
    IInterventionSimulatedData,
    ISimulationResultsSuccess,
    ISimulationResultsError,
    ContinuityType,
    IContinuityCheckResult,
)
from shared import (
    get_equation,
    get_compartment_equation,
    get_hamiltonian_equation,
    get_lambda_derivative,
    get_intervention_derivative,
    check_continuity,
    is_population_preserved,
    simulate_model,
    calculate_cost,
    get_lambda_values,
    get_intervention_values,
)


def optimal_control(payload: IOptimalControlData) -> (
    ISimulationResultsSuccess | ISimulationResultsError
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

    eps: float = 1e-3
    iterations: int = 0

    symbols_table: ISymbolsTable = {
        compartment.name: Symbol(compartment.name)
        for compartment in payload.model
    }
    simulation_model: List[ISimulationCompartment] = []
    simulation_interventions_derivatives: List[ISimulationIntervention] = []
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

    for intervention in payload.interventions:
        simulation_interventions_derivatives.append(
            ISimulationIntervention(
                intervention.name,
                get_intervention_derivative(
                    hamiltonian.symbolic_equation,
                    symbols_table[intervention.name]
                )
            )
        )

    try:
        variables_datatable: IVariablesDatatable = {
            **{
                compartment.name: [compartment.value] + [0] * int(
                    payload.simulation_parameters.time /
                    payload.simulation_parameters.step
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

        simulation_results: List[ICompartmentSimulatedData] = simulate_model(
            simulation_model,
            payload.simulation_parameters,
            variables_datatable
        )

        previous_cost: float = 0
        current_cost: float = calculate_cost(
            cost_function,
            payload.simulation_parameters,
            variables_datatable
        )

        while True:
            get_lambda_values(
                simulation_lambdas_derivatives,
                payload.simulation_parameters,
                variables_datatable
            )

            interventions_values: List[IInterventionSimulatedData] = get_intervention_values(
                simulation_interventions_derivatives,
                payload.simulation_parameters,
                variables_datatable
            )

            simulation_results: List[ICompartmentSimulatedData] = simulate_model(
                simulation_model,
                payload.simulation_parameters,
                variables_datatable
            )

            previous_cost = current_cost
            current_cost = calculate_cost(
                cost_function,
                payload.simulation_parameters,
                variables_datatable
            )

            iterations += 1

            if abs(current_cost - previous_cost) <= eps:
                break

        return ISimulationResultsSuccess(
            payload.simulation_parameters.time,
            payload.simulation_parameters.step,
            [
                *simulation_results,
                *interventions_values
            ],
            True
        )

    except ValueError as e:
        return ISimulationResultsError(
            str(e),
            False
        )
