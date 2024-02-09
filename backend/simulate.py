"""
Simulation module

This module contains the simulation logic
"""

from typing import List
from sympy import Symbol, Interval, oo

from definitions import (
    ISymbolsTable,
    IVariablesDatatable,
    ISimulationCompartment,
    IResponseSimulationParameters,
    ISimulationRequestData,
    ICompartmentResponseData,
    ISimulationResponsePayload,
    ISimulationSuccessResponseData,
    ISimulationErrorResponseData,
    ISimulationResponse,
    ContinuityType,
    IContinuityCheckResult
)
from shared import (
    get_compartment_equation,
    check_continuity,
    is_population_preserved,
    simulate_model,
)


def simulate(data: ISimulationRequestData) -> ISimulationResponse:
    """
    Simulation function

    This function simulates the model and returns the results

    Parameters
    ----------
    data : ISimulationRequestData
        The simulation request data

    Returns
    -------
    ISimulationResponse
        The simulation response
    """

    symbols_table: ISymbolsTable = {
        compartment.name: Symbol(compartment.name)
        for compartment in data.payload.compartments
    }
    simulation_model: List[ISimulationCompartment] = []

    for compartment in data.payload.compartments:
        simulation_compartment: ISimulationCompartment = ISimulationCompartment(
            compartment.name,
            compartment.value,
            get_compartment_equation(compartment, symbols_table)
        )

        continuity_type: IContinuityCheckResult = check_continuity(
            simulation_compartment.equation.symbolic_equation,
            symbols_table,
            Interval(0, oo)
        )

        if continuity_type.type == ContinuityType.DISCONTINUOUS:
            return ISimulationErrorResponseData(
                f'Equation of {compartment.name} is discontinuous by {
                    continuity_type.discontinuity_symbol}',
                False
            )

        simulation_model.append(simulation_compartment)

    if not is_population_preserved(
        [compartment.equation.symbolic_equation for compartment in simulation_model]
    ):
        return ISimulationErrorResponseData(
            'Model equations do not preserve population. ' +
            'Apparently that is result of a program bug. Please reload the page and try again',
            False
        )

    try:
        variables_datatable: IVariablesDatatable = {
            compartment.name: [compartment.value] + [0] * (
                data.parameters.nodes_amount
            )
            for compartment in simulation_model
        }

        simulation_results: List[ICompartmentResponseData] = simulate_model(
            simulation_model,
            data.parameters,
            variables_datatable
        )

        return ISimulationSuccessResponseData(
            IResponseSimulationParameters(
                data.parameters.time,
                data.parameters.nodes_amount
            ),
            ISimulationResponsePayload(
                simulation_results
            ),
            True
        )

    except ValueError as e:
        return ISimulationErrorResponseData(
            str(e),
            False
        )
