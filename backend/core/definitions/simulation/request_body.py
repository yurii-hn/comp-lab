"""Simulation Request Body"""

from typing import TypedDict

from core.definitions.model.model import ModelDefinition
from core.definitions.simulation.parameters import \
    SimulationParametersDefinition


class SimulationRequestBodyDefinition(TypedDict):
    """Simulation Request Body"""

    parameters: SimulationParametersDefinition
    model: ModelDefinition
