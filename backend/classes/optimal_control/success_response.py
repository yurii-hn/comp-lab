from typing import Literal, TypedDict

from classes.model.model import Model
from classes.optimal_control.parameters import OptimalControlParameters
from classes.optimal_control.result import OptimalControlResult
from classes.simulation.result import SimulationResult


class OptimalControlSuccessResponse(TypedDict):
    type: Literal["OptimalControl"]
    parameters: OptimalControlParameters
    model: Model
    result: tuple[SimulationResult, OptimalControlResult]
