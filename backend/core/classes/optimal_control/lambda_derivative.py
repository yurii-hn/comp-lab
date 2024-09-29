"""Lambda Derivative Class"""

from core.classes.model.equation import Equation
from sympy import Symbol


class LambdaDerivative:
    """Lambda Derivative"""

    name: str

    symbol: Symbol
    equation: Equation

    @property
    def variables(self) -> list[Symbol]:
        """Variables"""

        return self.equation.variables

    def __init__(self, name: str, compartment: Symbol, hamiltonian: Equation) -> None:
        self.name = name

        self.symbol = Symbol(name)
        self.equation = Equation()

        self.equation.add(-hamiltonian.expression.diff(compartment))
