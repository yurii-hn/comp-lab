from typing import TypedDict

from classes.model.model import Model
from classes.optimal_control.parameters import OptimalControlParameters


class OptimalControlRequestBody(TypedDict):
    parameters: OptimalControlParameters
    model: Model
