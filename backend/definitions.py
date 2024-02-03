"""
Definitions module

This module contains the definitions of the interfaces used in the backend.
"""

from dataclasses import dataclass
from enum import Enum
from typing import List, TypedDict, Dict, Callable
from sympy import Symbol, Expr


class ISymbolsTable(Dict[str, Symbol]):
    """Table of symbols"""


class IVariablesDatatable(Dict[str, List[float]]):
    """Table of variables"""


@dataclass
class IEquation():
    """Equation"""
    vars: List[Symbol]
    equation_function: Callable[..., float]
    symbolic_equation: Expr


class IRawCompartmentBase(TypedDict):
    """Raw compartment base"""
    name: str
    value: float


@dataclass
class ICompartmentBase:
    """Compartment base"""
    name: str
    value: float


class IRawCompartment(IRawCompartmentBase):
    """Raw compartment"""
    inflows: List[str]
    outflows: List[str]


@dataclass
class ICompartment(ICompartmentBase):
    """Compartment"""
    inflows: List[str]
    outflows: List[str]


class IRawIntervention(TypedDict):
    """Raw intervention"""
    name: str


@dataclass
class IIntervention():
    """Intervention"""
    name: str


@dataclass
class ISimulationCompartment(ICompartmentBase):
    """Simulation compartment"""
    equation: IEquation


@dataclass
class ISimulationIntervention(IIntervention):
    """Simulation intervention"""
    equation: IEquation


@dataclass
class ISimulationLambda():
    """Simulation lambda"""
    name: str
    equation: IEquation


class IRawSimulationParameters(TypedDict):
    """Raw simulation parameters"""
    time: float
    step: float


@dataclass
class ISimulationParameters:
    """Simulation parameters"""
    step: float
    time: float


class IRawSimulationData(TypedDict):
    """Raw simulation data"""
    model: List[IRawCompartment]
    simulationParameters: IRawSimulationParameters


class IRawOptimalControlData(IRawSimulationData):
    """Raw optimal control data"""
    interventions: List[IRawIntervention]
    costFunction: str


@dataclass
class ISimulationData:
    """Simulation data"""
    model: List[ICompartment]
    simulation_parameters: ISimulationParameters

    def __init__(
        self,
        model: List[IRawCompartment],
        simulation_parameters: IRawSimulationParameters
    ):
        self.model = [
            ICompartment(*compartment.values())
            for compartment in model
        ]
        self.simulation_parameters = ISimulationParameters(
            *simulation_parameters.values()
        )


@dataclass
class IOptimalControlData(ISimulationData):
    """Optimal control data"""
    interventions: List[IIntervention]
    cost_function: str

    def __init__(
        self,
        model: List[IRawCompartment],
        simulation_parameters: IRawSimulationParameters,
        cost_function: str,
        interventions: List[IRawIntervention]
    ):
        super().__init__(model, simulation_parameters)
        self.interventions = [
            IIntervention(*intervention.values()) for intervention in interventions
        ]
        self.cost_function = cost_function


@dataclass
class ICompartmentSimulatedData:
    """Compartment simulated data"""
    name: str
    values: List[float]


@dataclass
class IInterventionSimulatedData:
    """Intervention simulated data"""
    name: str
    values: List[float]


@dataclass
class ILambdaSimulatedData:
    """Lambda simulated data"""
    name: str
    values: List[float]


@dataclass
class ISimulationResultsSuccess:
    """Simulation results success"""
    time: float
    step: float
    compartments: List[ICompartmentSimulatedData]
    interventions: List[IInterventionSimulatedData] | None
    success: True


@dataclass
class ISimulationResultsError:
    """Simulation results error"""
    error: str
    success: False


class IRawValidationPayload(TypedDict):
    """Validation payload"""
    expression: str
    allowedSymbols: List[str]


@dataclass
class IValidationPayload:
    """Validation payload"""
    expression: str
    allowed_symbols: List[str]


@dataclass
class IValidationResult:
    """Validation result"""
    is_valid: bool
    message: str


class ContinuityType(Enum):
    """Continuous type"""

    CONTINUOUSLY_DIFFERENTIABLE = 0
    CONTINUOUS = 1
    DISCONTINUOUS = 2


@dataclass
class IContinuityCheckResult():
    """Raw simulation parameters"""
    type: ContinuityType
    discontinuity_symbol: Symbol | None
