from typing import Literal, TypedDict

from classes.model.model import Model
from classes.parameters_identification.parameters import PIParameters
from classes.parameters_identification.result import PIResult


class PISuccessResponse(TypedDict):
    type: Literal["PI"]
    parameters: PIParameters
    model: Model
    result: PIResult
