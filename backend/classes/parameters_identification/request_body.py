from typing import TypedDict

from classes.model.model import Model
from classes.parameters_identification.parameters import PIParameters


class PIRequestBody(TypedDict):
    parameters: PIParameters
    model: Model
