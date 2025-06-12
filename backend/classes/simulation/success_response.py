from typing import Literal, TypedDict

from classes.model.model import Model
from classes.simulation.parameters import SimulationParameters
from classes.simulation.result import SimulationResult


class SimulationSuccessResponse(TypedDict):
    type: Literal["Simulation"]
    parameters: SimulationParameters
    model: Model
    result: SimulationResult
