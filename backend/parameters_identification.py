"""
Parameters identification

This module is used for the parameters identification
"""

from typing import List, cast
from scipy.optimize import minimize, OptimizeResult
from sympy import Symbol, Interval, oo

from definitions import (
    IConstant,
    IResponsePISelectedConstant,
    ISolutionWithInterventions,
    ISymbolsTable,
    IVariablesDatatable,
    ISimulationCompartment,
    ContinuityType,
    IContinuityCheckResult,
    ICompartmentResponseData,
    IPIRequestData,
    is_IPIRequestDataWithInterventions,
    ISolutionData,
    IPIResponse,
    IPIErrorResponse,
    IPISuccessResponse,
    IResponsePIParameters,
    IPIResponsePayloadWithoutInterventions,
    IPIResponsePayloadWithInterventions,
)
from shared import (
    get_compartment_equation,
    check_continuity,
    is_population_preserved,
    simulate_model,
)


def parameters_identification(data: IPIRequestData) -> IPIResponse:
    """
    Identify the parameters

    This function is used to identify the parameters of the model

    Parameters
    ----------
    data : IPIRequestData
        The data to identify the parameters

    Returns
    -------
    IPIResponse
        The response of the identification

    Raises
    ------
    ValueError
        If the optimization fails
    """
    is_with_interventions: bool = is_IPIRequestDataWithInterventions(
        data)

    symbols_table: ISymbolsTable = ISymbolsTable({
        **{
            compartment.name: Symbol(compartment.name)
            for compartment in data.payload.model.compartments
        },
        **{
            constant.name: Symbol(constant.name)
            for constant in data.payload.model.constants
        },
        **{
            constant.name: Symbol(constant.name)
            for constant in data.parameters.selected_constants
        }
    })

    if is_with_interventions:
        for intervention in data.payload.model.interventions:
            symbols_table[intervention.name] = Symbol(intervention.name)

    simulation_model: List[ISimulationCompartment] = []

    for compartment in data.payload.model.compartments:
        simulation_compartment: ISimulationCompartment = ISimulationCompartment(
            compartment.name,
            compartment.value,
            get_compartment_equation(
                compartment,
                data.payload.model.constants,
                symbols_table
            )
        )

        continuity_type: IContinuityCheckResult = check_continuity(
            simulation_compartment.equation.symbolic_equation,
            symbols_table,
            Interval(0, oo),
            True
        )

        if continuity_type.type == ContinuityType.DISCONTINUOUS:
            return IPIErrorResponse(
                f'Equation of {compartment.name} is discontinuous by {continuity_type.discontinuity_symbol}',
                False
            )
        elif continuity_type.type == ContinuityType.CONTINUOUS:
            return IPIErrorResponse(
                f'Equation derivative for {compartment.name} is not continuous by {continuity_type.discontinuity_symbol}',
                False
            )

        simulation_model.append(simulation_compartment)

    if not is_population_preserved(
        [compartment.equation.symbolic_equation for compartment in simulation_model]
    ):
        return IPIErrorResponse(
            'Model equations do not preserve population' +
            'Apparently that is result of a program bug. Please reload the page and try again',
            False
        )

    try:
        simulation_results: List[List[ICompartmentResponseData]] = [
            cast(
                List[ICompartmentResponseData],
                []
            ),
        ]

        minimize_result: OptimizeResult = cast(
            OptimizeResult,
            minimize(
                optimization_criteria,
                [
                    constant.value
                    for constant in data.parameters.selected_constants
                ],
                args=(
                    simulation_model,
                    data,
                    is_with_interventions,
                    simulation_results
                ),
                bounds=[
                    (
                        constant.lower_boundary,
                        constant.upper_boundary
                    )
                    for constant in data.parameters.selected_constants
                ],
                method='L-BFGS-B',
                tol=1e-3
            )
        )

        minimized_constants: List[IConstant] = [
            IConstant(
                constant.name,
                minimize_result.x[i],
            )
            for i, constant in enumerate(data.parameters.selected_constants)
        ]

        return IPISuccessResponse(
            IResponsePIParameters(
                [
                    IResponsePISelectedConstant(
                        constant.name,
                        constant.value,
                        constant.upper_boundary,
                        constant.lower_boundary
                    ) for constant in data.parameters.selected_constants
                ],
                data.parameters.time_step,
            ),
            (
                IPIResponsePayloadWithoutInterventions(
                    minimized_constants,
                    data.payload.solution,
                    simulation_results[0]
                ) if not is_with_interventions else
                IPIResponsePayloadWithInterventions(
                    minimized_constants,
                    data.payload.solution,
                    simulation_results[0]
                )
            ),
            True
        )

    except ValueError as e:
        return IPIErrorResponse(
            str(e),
            False
        )


def optimization_criteria(
    constants_vector: List[float],
    simulation_model: List[ISimulationCompartment],
    data: IPIRequestData,
    is_with_interventions: bool,
    simulation_results: List[List[ICompartmentResponseData]]
) -> float:
    """
    Optimization criteria

    This function is used to calculate the optimization criteria

    Parameters
    ----------
    constants_vector : List[float]
        The constants vector
    simulation_model : List[ISimulationCompartment]
        The simulation model
    data : IPIRequestData
        The data
    simulation_results : List[List[ICompartmentResponseData]]
        The simulation results

    Returns
    -------
    float
        The optimization criteria
    """
    nodes_amount: int = len(data.payload.solution.compartments[0].values) - 1

    variables_datatable: IVariablesDatatable = IVariablesDatatable({
        **{
            compartment.name: [compartment.value] + [0] * (
                nodes_amount
            )
            for compartment in simulation_model
        },
        **{
            constant.name: [constants_vector[i]] * nodes_amount
            for i, constant in enumerate(data.parameters.selected_constants)
        }
    })

    if is_with_interventions:
        for intervention in cast(ISolutionWithInterventions, data.payload.solution).interventions:
            variables_datatable[intervention.name] = intervention.values

    if is_IPIRequestDataWithInterventions(data):
        variables_datatable.update({
            intervention.name: intervention.values
            for intervention in data.payload.solution.interventions
        })

    simulation_results[0] = simulate_model(
        simulation_model,
        data.parameters.time_step,
        nodes_amount,
        variables_datatable,
        True
    )

    return calculate_cost(
        simulation_results[0],
        data.payload.solution.compartments
    )


def calculate_cost(
    simulation_results: List[ICompartmentResponseData],
    solution_results: List[ISolutionData]
) -> float:
    """Cost function"""
    cost: float = 0

    for i, compartment in enumerate(simulation_results):
        for j, value in enumerate(compartment.values):
            cost += (value - solution_results[i].values[j]) ** 2

    return cost
