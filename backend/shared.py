"""Shared functions for the backend"""

from typing import List, cast, Set
from sympy import sympify, lambdify, diff, Interval, nsimplify, Expr, FiniteSet, Symbol
from sympy.calculus.util import continuous_domain
from sympy.sets import Reals

from definitions import (
    IConstant,
    ISymbolsTable,
    IVariablesDatatable,
    IEquation,
    ICompartment,
    ISimulationCompartment,
    IRequestSimulationParameters,
    ICompartmentResponseData,
    ContinuityType,
    IContinuityCheckResult
)


def get_equation(
    function_string: str,
    constants: List[IConstant],
    symbols_table: ISymbolsTable
) -> IEquation:
    """Get the equation from string"""
    symbolic_equation: Expr = sympify(
        function_string.replace('^', '**'),
        symbols_table
    )

    for constant in constants:
        symbolic_equation = cast(
            Expr,
            symbolic_equation.subs(
                constant.name,
                constant.value
            )
        )

    return IEquation(
        list(
            cast(
                Set[Symbol],
                symbolic_equation.free_symbols
            )
        ),
        lambdify(
            list(symbolic_equation.free_symbols),
            symbolic_equation
        ),
        symbolic_equation,
    )


def get_compartment_equation(
    compartment: ICompartment,
    constants: List[IConstant],
    symbols_table: ISymbolsTable
) -> IEquation:
    """Get the equations for each compartment"""

    compartment_symbolic_equation: Expr = cast(Expr, 0)

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

    for constant in constants:
        compartment_symbolic_equation = cast(
            Expr,
            compartment_symbolic_equation.subs(
                constant.name,
                constant.value
            )
        )

    equation: IEquation = IEquation(
        list(
            cast(
                Set[Symbol],
                compartment_symbolic_equation.free_symbols
            )
        ),
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
    domain: FiniteSet | Interval = Reals,
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

    sum_equation: Expr = cast(Expr, 0)

    for equation in compartments_equations:
        sum_equation += equation  # type: ignore

    if nsimplify(sum_equation, tolerance=1e-10) != 0:
        return False

    return True


def simulate_model(
    model: List[ISimulationCompartment],
    step_size: float,
    nodes_amount: int,
    variables_datatable: IVariablesDatatable,
    ignore_negative_values: bool = False
) -> List[ICompartmentResponseData]:
    """Model simulation function"""
    for i in range(nodes_amount):
        for compartment in model:
            values: List[float] = [
                variables_datatable[str(var)][i]
                for var in compartment.equation.vars
            ]

            variables_datatable[compartment.name][i + 1] = (
                variables_datatable[compartment.name][i] +
                compartment.equation.equation_function(*values) *
                step_size
            )

            if variables_datatable[compartment.name][i + 1] < 0 and not ignore_negative_values:
                raise ValueError(
                    f'Negative value for {compartment.name} at time {i + 1}'
                )

    simulation_results: List[ICompartmentResponseData] = [
        ICompartmentResponseData(
            compartment.name,
            variables_datatable[compartment.name]
        )
        for compartment in model
    ]

    return simulation_results
