"""Shared functions for the backend"""

from typing import List
from sympy import sympify, lambdify, diff, Interval, nsimplify, Expr
from sympy.calculus.util import continuous_domain
from sympy.sets import Reals

from definitions import (
    ISymbolsTable,
    IVariablesDatatable,
    IEquation,
    ICompartment,
    ISimulationCompartment,
    ISimulationParameters,
    ICompartmentSimulatedData,
    ContinuityType,
    IContinuityCheckResult
)


def get_equation(function_string: str, symbols_table: ISymbolsTable) -> IEquation:
    """Get the equation from string"""
    symbolic_equation: Expr = sympify(
        function_string.replace('^', '**'),
        symbols_table
    )

    return IEquation(
        list(symbolic_equation.free_symbols),
        lambdify(
            list(symbolic_equation.free_symbols),
            symbolic_equation
        ),
        symbolic_equation,
    )


def get_compartment_equation(
    compartment: ICompartment,
    symbols_table: ISymbolsTable
) -> IEquation:
    """Get the equations for each compartment"""

    compartment_symbolic_equation: Expr = 0

    for inflow in compartment.inflows:
        compartment_symbolic_equation += sympify(
            inflow.replace('^', '**'),
            symbols_table
        )

    for outflow in compartment.outflows:
        compartment_symbolic_equation -= sympify(
            outflow.replace('^', '**'),
            symbols_table
        )

    equation: IEquation = IEquation(
        list(compartment_symbolic_equation.free_symbols),
        lambdify(
            list(compartment_symbolic_equation.free_symbols),
            compartment_symbolic_equation
        ),
        compartment_symbolic_equation,
    )

    return equation


def check_continuity(
    equation: Expr,
    symbols_table: ISymbolsTable,
    domain: Interval = Reals,
    derivative: bool = False,
) -> IContinuityCheckResult:
    """Check if equation is continuous for all symbols"""

    for symbol in symbols_table.values():
        if not continuous_domain(equation, symbol, domain) == domain:
            return IContinuityCheckResult(
                ContinuityType.DISCONTINUOUS,
                symbol
            )

        if derivative:
            if not continuous_domain(
                diff(equation, symbol),
                symbol,
                domain
            ) == domain:
                return IContinuityCheckResult(
                    ContinuityType.CONTINUOUS,
                    symbol
                )

    return IContinuityCheckResult(
        ContinuityType.CONTINUOUSLY_DIFFERENTIABLE if derivative else ContinuityType.CONTINUOUS,
        None
    )


def is_population_preserved(compartments_equations: List[Expr]) -> bool:
    """Check if population is preserved"""

    sum_equation: Expr = 0

    for equation in compartments_equations:
        sum_equation += equation

    if nsimplify(sum_equation, tolerance=1e-10) != 0:
        return False

    return True


def simulate_model(
    model: List[ISimulationCompartment],
    simulation_parameters: ISimulationParameters,
    variables_datatable: IVariablesDatatable
) -> List[ICompartmentSimulatedData]:
    """Model simulation function"""
    for t in range(int(simulation_parameters.time / simulation_parameters.step) - 1):
        for compartment in model:
            values: List[float] = [
                variables_datatable[str(var)][t]
                for var in compartment.equation.vars
            ]

            variables_datatable[compartment.name][t + 1] = (
                variables_datatable[compartment.name][t] +
                compartment.equation.equation_function(*values)
            )

            if variables_datatable[compartment.name][t + 1] < 0:
                raise ValueError(
                    f'Negative value for {compartment.name} at time {t + 1}'
                )

    simulation_results: List[ICompartmentSimulatedData] = [
        ICompartmentSimulatedData(
            compartment.name,
            variables_datatable[compartment.name]
        )
        for compartment in model
    ]

    return simulation_results
