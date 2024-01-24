"""Shared functions for the backend"""

from typing import List
from sympy import Symbol, sympify, lambdify, solve, diff, Interval, nsimplify, Expr
from sympy.calculus.util import continuous_domain
from sympy.sets import Reals

from definitions import (
    ISymbolsTable,
    IVariablesDatatable,
    IEquation,
    ICompartment,
    ISimulationCompartment,
    ISimulationIntervention,
    ISimulationLambda,
    ISimulationParameters,
    ICompartmentSimulatedData,
    IInterventionSimulatedData,
    ILambdaSimulatedData,
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
        lambdify(symbolic_equation.free_symbols, symbolic_equation),
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
            compartment_symbolic_equation.free_symbols,
            compartment_symbolic_equation
        ),
        compartment_symbolic_equation,
    )

    return equation


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
        lambdify(hamiltonian_equation.free_symbols, hamiltonian_equation),
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
            lambda_derivative_symbolic_equation.free_symbols,
            lambda_derivative_symbolic_equation
        ),
        lambda_derivative_symbolic_equation,
    )


def get_intervention_derivative(hamiltonian: Expr, intervention: Symbol) -> IEquation:
    """Get the intervention derivative"""
    intervention_derivative_symbolic_equation: Expr = solve(
        diff(hamiltonian, intervention),
        intervention
    )[0]

    return IEquation(
        list(intervention_derivative_symbolic_equation.free_symbols),
        lambdify(
            intervention_derivative_symbolic_equation.free_symbols,
            intervention_derivative_symbolic_equation
        ),
        intervention_derivative_symbolic_equation,
    )


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
    for t in range(int(simulation_parameters.time / simulation_parameters.step)):
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


def get_intervention_values(
    interventions: List[ISimulationIntervention],
    simulation_parameters: ISimulationParameters,
    variables_datatable: IVariablesDatatable
) -> List[IInterventionSimulatedData]:
    """Update interventions"""
    for t in range(int(simulation_parameters.time / simulation_parameters.step)):
        for intervention in interventions:
            values: List[float] = [
                variables_datatable[str(var)][t]
                for var in intervention.equation.vars
            ]

            variables_datatable[intervention.name][t] = min(
                0.9,
                max(
                    0,
                    intervention.equation.equation_function(*values)
                )
            )

    interventions_values: List[IInterventionSimulatedData] = [
        IInterventionSimulatedData(
            intervention.name,
            variables_datatable[intervention.name]
        )
        for intervention in interventions
    ]

    return interventions_values
