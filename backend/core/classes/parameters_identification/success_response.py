"""Parameters Identification Success Response Class"""

from core.classes.model.model import Model
from core.classes.parameters_identification.parameters import PIParameters
from core.classes.parameters_identification.result import PIResult
from core.definitions.common.processing_type import ProcessingType
from core.definitions.parameters_identification.success_response import \
    PISuccessResponseDefinition


class PISuccessResponse:
    """PI Success Response"""

    _type: ProcessingType = ProcessingType.PI
    parameters: PIParameters
    model: Model
    result: PIResult

    @property
    def definition(self) -> PISuccessResponseDefinition:
        """Definition"""

        return {
            "type": self._type.value,
            "parameters": self.parameters.definition,
            "model": self.model.definition,
            "result": self.result.definition,
        }

    def __init__(self, definition: PISuccessResponseDefinition) -> None:
        self.parameters = PIParameters(definition["parameters"])
        self.model = Model(definition["model"])
        self.result = PIResult(definition["result"])
