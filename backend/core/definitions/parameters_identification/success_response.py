"""Parameters Identification Success Response Definition"""

from typing import TypedDict

from core.definitions.common.processing_type import ProcessingType
from core.definitions.model.model import ModelDefinition
from core.definitions.parameters_identification.parameters import \
    PIParametersDefinition
from core.definitions.parameters_identification.result import \
    PIResultDefinition


class PISuccessResponseDefinition(TypedDict):
    """PI Success Response Definition"""

    type: ProcessingType.OPTIMAL_CONTROL
    parameters: PIParametersDefinition
    model: ModelDefinition
    result: PIResultDefinition
