"""Simulation Success Response Definition"""

from typing import TypedDict

from core.definitions.common.processing_type import ProcessingType
from core.definitions.model.model import ModelDefinition
from core.definitions.simulation.parameters import \
    SimulationParametersDefinition
from core.definitions.simulation.result import SimulationResultDefinition


class SimulationSuccessResponseDefinition(TypedDict):
    """Simulation Success Response Definition"""

    type: ProcessingType.SIMULATION
    parameters: SimulationParametersDefinition
    model: ModelDefinition
    result: SimulationResultDefinition
