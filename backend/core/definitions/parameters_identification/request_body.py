"""PI Request Body Definition"""

from typing import TypedDict

from core.definitions.model.model import ModelDefinition
from core.definitions.parameters_identification.parameters import \
    PIParametersDefinition


class PIRequestBodyDefinition(TypedDict):
    """PI Request Body"""

    parameters: PIParametersDefinition
    model: ModelDefinition
