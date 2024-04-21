"""
Definitions module

This module contains the definitions of the interfaces used in the backend.
"""

from dataclasses import dataclass
from enum import Enum
from typing import List, TypedDict, Dict, Callable, TypeVar, Generic, Tuple, Literal, TypeGuard
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


class IRawConstant(TypedDict):
    """Raw constant"""
    name: str
    value: float


@dataclass
class IConstant():
    """Constant"""
    name: str
    value: float


class IRawIntervention(TypedDict):
    """Raw intervention"""
    name: str


@dataclass
class IIntervention():
    """Intervention"""
    name: str


class IRawModel(TypedDict):
    """Raw model"""
    compartments: List[IRawCompartment]
    constants: List[IRawConstant]


@dataclass
class IModel:
    """Model"""
    compartments: List[ICompartment]
    constants: List[IConstant]

    def __init__(
        self,
        compartments: List[IRawCompartment],
        constants: List[IRawConstant]
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

        self.constants = [
            IConstant(
                name=constant['name'],
                value=constant['value']
            )
            for constant in constants
        ]


class IRawModelWithInterventions(IRawModel):
    """Raw model with interventions"""
    interventions: List[IRawIntervention]


@dataclass
class IModelWithInterventions(IModel):
    """Model with interventions"""
    interventions: List[IIntervention]

    def __init__(
        self,
        compartments: List[IRawCompartment],
        constants: List[IRawConstant],
        interventions: List[IRawIntervention]
    ):
        super().__init__(compartments, constants)
        self.interventions = [
            IIntervention(
                name=intervention['name']
            )
            for intervention in interventions
        ]


@dataclass
class ISimulationCompartment(ICompartmentBase):
    """Simulation compartment"""
    equation: IEquation


@dataclass
class ISimulationLambda():
    """Simulation lambda"""
    name: str
    derivative_equation: IEquation


class IRawRequestSimulationParameters(TypedDict):
    """Raw parameters"""
    time: float
    nodesAmount: int


@dataclass
class IRequestSimulationParameters:
    """Parameters"""
    time: float
    nodes_amount: int


class InterventionApproximationType(Enum):
    """Intervention approximation type"""

    PIECEWISE_CONSTANT = 'piecewise-constant'
    PIECEWISE_LINEAR = 'piecewise-linear'


class IRawRequestOptimalControlParameters(IRawRequestSimulationParameters):
    """Optimal control parameters"""
    costFunction: str
    interventionNodesAmount: int
    interventionUpperBoundary: float
    interventionLowerBoundary: float
    interventionApproximationType: InterventionApproximationType


@dataclass
class IRequestOptimalControlParameters(IRequestSimulationParameters):
    """Optimal control parameters"""
    cost_function: str
    intervention_nodes_amount: int
    intervention_upper_boundary: float
    intervention_lower_boundary: float
    intervention_approximation_type: InterventionApproximationType


class IRawPISelectedConstant(TypedDict):
    """Raw selected constants"""
    name: str
    value: float
    upperBoundary: float
    lowerBoundary: float


@dataclass
class IPISelectedConstant(IConstant):
    """Selected constants"""
    upper_boundary: float
    lower_boundary: float


class IRawRequestPIParameters(TypedDict):
    """Parameter identification parameters"""
    selectedConstants: List[IRawPISelectedConstant]
    timeStep: float


@dataclass
class IRequestPIParameters:
    """Parameter identification parameters"""
    selected_constants: List[IPISelectedConstant]
    time_step: float


class IRawRequestData(TypedDict, Generic[ParametersType, PayloadType]):
    """Raw data"""
    parameters: ParametersType
    payload: PayloadType


@dataclass
class IRequestData(Generic[ParametersType, PayloadType]):
    """Request data"""
    parameters: ParametersType
    payload: PayloadType


IRawSimulationRequestPayload = IRawModel

ISimulationRequestPayload = IModel


IRawSimulationRequestData = IRawRequestData[
    IRawRequestSimulationParameters,
    IRawSimulationRequestPayload
]

ISimulationRequestData = IRequestData[
    IRequestSimulationParameters,
    ISimulationRequestPayload
]


IRawOptimalControlRequestPayload = IRawModelWithInterventions

IOptimalControlRequestPayload = IModelWithInterventions


IRawOptimalControlRequestData = IRawRequestData[
    IRawRequestOptimalControlParameters,
    IRawOptimalControlRequestPayload
]

IOptimalControlRequestData = IRequestData[
    IRequestOptimalControlParameters,
    IOptimalControlRequestPayload
]


class IRawSolutionData(TypedDict):
    """Response data"""
    name: str
    values: List[float]


@dataclass
class ISolutionData:
    """Response data"""
    name: str
    values: List[float]


class IRawSolutionWithoutInterventions(TypedDict):
    """Raw parameter identification solution data"""
    compartments: List[IRawSolutionData]


@dataclass
class ISolutionWithoutInterventions:
    """Parameter identification solution data"""
    compartments: List[ISolutionData]


class IRawSolutionWithInterventions(IRawSolutionWithoutInterventions):
    """Raw parameter identification solution data"""
    interventions: List[IRawSolutionData]


@dataclass
class ISolutionWithInterventions(ISolutionWithoutInterventions):
    """Parameter identification solution data"""
    interventions: List[ISolutionData]


class IRawPIRequestPayloadWithoutInterventions(TypedDict):
    """Raw optimal control request payload"""
    solution: IRawSolutionWithoutInterventions
    model: IRawModel


@dataclass
class IPIRequestPayloadWithoutInterventions():
    """Optimal control request payload"""
    solution: ISolutionWithoutInterventions
    model: IModel


class IRawPIRequestPayloadWithInterventions():
    """Raw optimal control request payload"""
    solution: IRawSolutionWithInterventions
    model: IRawModelWithInterventions


@dataclass
class IPIRequestPayloadWithInterventions():
    """Optimal control request payload"""
    solution: ISolutionWithInterventions
    model: IModelWithInterventions


IRawPIRequestDataWithoutInterventions = IRawRequestData[
    IRawRequestPIParameters,
    IRawPIRequestPayloadWithoutInterventions
]

IPIRequestDataWithoutInterventions = IRequestData[
    IRequestPIParameters,
    IPIRequestPayloadWithoutInterventions
]

IRawPIRequestDataWithInterventions = IRawRequestData[
    IRawRequestPIParameters,
    IRawPIRequestPayloadWithInterventions
]

IPIRequestDataWithInterventions = IRequestData[
    IRequestPIParameters,
    IPIRequestPayloadWithInterventions
]

IRawPIRequestData = IRawPIRequestDataWithoutInterventions | IRawPIRequestDataWithInterventions

IPIRequestData = IPIRequestDataWithoutInterventions | IPIRequestDataWithInterventions


@dataclass
class IResponseSimulationParameters():
    """Simulation parameters"""
    time: float
    nodesAmount: int


@dataclass
class IResponseOptimalControlParameters(IResponseSimulationParameters):
    """Optimal control parameters"""
    costFunction: str
    interventionNodesAmount: int
    interventionUpperBoundary: float
    interventionLowerBoundary: float
    interventionApproximationType: InterventionApproximationType


@dataclass
class IResponsePISelectedConstant():
    """Selected constants"""
    name: str
    value: float
    upperBoundary: float
    lowerBoundary: float


@dataclass
class IResponsePIParameters:
    """Parameter identification parameters"""
    selectedConstants: List[IResponsePISelectedConstant]
    timeStep: float


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
    approximatedInterventions: List[IInterventionResponseData]
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


IApproximatedSolution = List[ICompartmentResponseData]


@dataclass
class IPIResponsePayloadWithoutInterventions:
    """Parameter identification results"""
    constants: List[IConstant]
    solution: ISolutionWithoutInterventions
    approximatedSolution: IApproximatedSolution


@dataclass
class IPIResponsePayloadWithInterventions:
    """Parameter identification results"""
    constants: List[IConstant]
    solution: ISolutionWithInterventions
    approximatedSolution: IApproximatedSolution


IPIResponsePayload = IPIResponsePayloadWithoutInterventions | IPIResponsePayloadWithInterventions

IPISuccessResponse = ISuccessResponseData[
    IResponsePIParameters,
    IPIResponsePayload
]

IPIErrorResponse = IErrorResponseData

IPIResponse = IPISuccessResponse | IPIErrorResponse


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


def is_IRawPIRequestDataWithInterventions(
        data: IRawPIRequestData
) -> TypeGuard[IRawPIRequestDataWithInterventions]:
    """Check if the data is IRawPIRequestDataWithInterventions"""
    return 'interventions' in data['payload']['model'].keys()


def is_IPIRequestDataWithInterventions(
        data: IPIRequestData
) -> TypeGuard[IPIRequestDataWithInterventions]:
    """Check if the data is IPIRequestDataWithInterventions"""
    return hasattr(data.payload.model, 'interventions')
