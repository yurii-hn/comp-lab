from typing import TypedDict

from classes.model.model import Model
from classes.simulation.parameters import SimulationParameters


class SimulationRequestBody(TypedDict):
    parameters: SimulationParameters
    model: Model
