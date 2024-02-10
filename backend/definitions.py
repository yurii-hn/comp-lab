"""
Definitions module

This module contains the definitions of the interfaces used in the backend.
"""

from dataclasses import dataclass
from enum import Enum
from typing import List, TypedDict, Dict, Callable, TypeVar, Generic, Tuple, Literal
from sympy import Symbol, Expr

ParametersType = TypeVar('ParametersType')
PayloadType = TypeVar('PayloadType')


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
class ISimulationLambda():
    """Simulation lambda"""
    name: str
    derivative_equation: IEquation


class IRawRequestParameters(TypedDict):
    """Raw parameters"""
    time: float
    nodesAmount: int


@dataclass
class IRequestParameters:
    """Parameters"""
    time: float
    nodes_amount: int


IRawRequestSimulationParameters = IRawRequestParameters

IRequestSimulationParameters = IRequestParameters


class InterventionApproximationType(Enum):
    """Intervention approximation type"""

    PIECEWISE_CONSTANT = 'piecewise-constant'
    PIECEWISE_LINEAR = 'piecewise-linear'


class IRawRequestOptimalControlParameters(IRawRequestParameters):
    """Optimal control parameters"""
    costFunction: str
    interventionNodesAmount: int
    interventionUpperBoundary: float
    interventionLowerBoundary: float
    interventionApproximationType: InterventionApproximationType


@dataclass
class IRequestOptimalControlParameters(IRequestParameters):
    """Optimal control parameters"""
    cost_function: str
    intervention_nodes_amount: int
    intervention_upper_boundary: float
    intervention_lower_boundary: float
    intervention_approximation_type: InterventionApproximationType


class IRawRequestData(TypedDict, Generic[ParametersType, PayloadType]):
    """Raw data"""
    parameters: ParametersType
    payload: PayloadType


@dataclass
class IRequestData(Generic[ParametersType, PayloadType]):
    """Request data"""
    parameters: ParametersType
    payload: PayloadType


class IRawSimulationRequestPayload(TypedDict):
    """Raw simulation request payload"""
    compartments: List[IRawCompartment]


@dataclass
class ISimulationRequestPayload:
    """Simulation request payload"""
    compartments: List[ICompartment]

    def __init__(self, compartments: List[IRawCompartment]):
        self.compartments = [
            ICompartment(
                name=compartment['name'],
                value=compartment['value'],
                inflows=compartment['inflows'],
                outflows=compartment['outflows']
            )
            for compartment in compartments
        ]


IRawSimulationRequestData = IRawRequestData[
    IRawRequestSimulationParameters,
    IRawSimulationRequestPayload
]

ISimulationRequestData = IRequestData[
    IRequestSimulationParameters,
    ISimulationRequestPayload
]


class IRawOptimalControlRequestPayload(TypedDict):
    """Raw optimal control request payload"""
    compartments: List[IRawCompartment]
    interventions: List[IRawIntervention]


@dataclass
class IOptimalControlRequestPayload:
    """Optimal control request payload"""
    compartments: List[ICompartment]
    interventions: List[IIntervention]

    def __init__(
        self,
        compartments: List[IRawCompartment],
        interventions: List[IRawIntervention]
    ):
        self.compartments = [
            ICompartment(
                name=compartment['name'],
                value=compartment['value'],
                inflows=compartment['inflows'],
                outflows=compartment['outflows']
            )
            for compartment in compartments
        ]
        self.interventions = [
            IIntervention(
                name=intervention['name']
            )
            for intervention in interventions
        ]


IRawOptimalControlRequestData = IRawRequestData[
    IRawRequestOptimalControlParameters,
    IRawOptimalControlRequestPayload
]

IOptimalControlRequestData = IRequestData[
    IRequestOptimalControlParameters,
    IOptimalControlRequestPayload
]


@dataclass
class IResponseParameters:
    """Parameters"""
    time: float
    nodesAmount: int


IResponseSimulationParameters = IResponseParameters


@dataclass
class IResponseOptimalControlParameters(IResponseParameters):
    """Optimal control parameters"""
    costFunction: str
    interventionNodesAmount: int
    interventionUpperBoundary: float
    interventionLowerBoundary: float
    interventionApproximationType: InterventionApproximationType


@dataclass
class IErrorResponseData:
    """Simulation results error"""
    error: str
    success: Literal[False]


@dataclass
class IResponseData:
    """Response data"""
    name: str
    values: List[float]


ICompartmentResponseData = IResponseData

IInterventionResponseData = IResponseData

ILambdaResponseData = IResponseData


@dataclass
class ISuccessResponseData(Generic[ParametersType, PayloadType]):
    """Success response data"""
    parameters: ParametersType
    payload: PayloadType
    success: Literal[True]


@dataclass
class ISimulationResponsePayload:
    """Simulation results"""
    compartments: List[ICompartmentResponseData]


ISimulationSuccessResponseData = ISuccessResponseData[
    IResponseSimulationParameters,
    ISimulationResponsePayload
]

ISimulationErrorResponseData = IErrorResponseData

ISimulationResponse = ISimulationSuccessResponseData | ISimulationErrorResponseData


@dataclass
class IOptimalControlResponsePayload:
    """Optimal control results success"""
    compartments: List[ICompartmentResponseData]
    interventions: List[IInterventionResponseData]


IOptimalControlSuccessResponse = ISuccessResponseData[
    IResponseOptimalControlParameters,
    Tuple[
        ISimulationResponsePayload,
        IOptimalControlResponsePayload
    ]
]

IOptimalControlErrorResponse = IErrorResponseData

IOptimalControlResponse = IOptimalControlSuccessResponse | IOptimalControlErrorResponse


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
