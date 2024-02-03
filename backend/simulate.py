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
    ISimulationData,
    ICompartmentSimulatedData,
    ISimulationResultsSuccess,
    ISimulationResultsError,
    ContinuityType,
    IContinuityCheckResult
)
from shared import (
    get_compartment_equation,
    check_continuity,
    is_population_preserved,
    simulate_model,
)


def simulate(payload: ISimulationData) -> ISimulationResultsSuccess | ISimulationResultsError:
    """
    Simulation function

    This function simulates the model and returns the results

    Parameters
    ----------
    payload : ISimulationData
        Payload

    Returns
    -------
    ISimulationResultsSuccess | ISimulationResultsError
        Simulation results
    """

    symbols_table: ISymbolsTable = {
        compartment.name: Symbol(compartment.name)
        for compartment in payload.model
    }
    simulation_model: List[ISimulationCompartment] = []

    for compartment in payload.model:
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
            return ISimulationResultsError(
                f'Equation of {compartment.name} is discontinuous by {continuity_type.discontinuity_symbol}',
                False
            )

        simulation_model.append(simulation_compartment)

    if not is_population_preserved(
        [compartment.equation.symbolic_equation for compartment in simulation_model]
    ):
        return ISimulationResultsError(
            'Model equations do not preserve population. ' +
            'Apparently that is result of a program bug. Please reload the page and try again',
            False
        )

    try:
        variables_datatable: IVariablesDatatable = {
            compartment.name: [compartment.value] + [0] * (
                int(
                    payload.simulation_parameters.time /
                    payload.simulation_parameters.step
                ) - 1
            )
            for compartment in simulation_model
        }

        simulation_results: List[ICompartmentSimulatedData] = simulate_model(
            simulation_model,
            payload.simulation_parameters,
            variables_datatable
        )

        return ISimulationResultsSuccess(
            payload.simulation_parameters.time,
            payload.simulation_parameters.step,
            simulation_results,
            None,
            True
        )

    except ValueError as e:
        return ISimulationResultsError(
            str(e),
            False
        )
