"""Parameters Identification Success Response Class"""

from core.classes.common.success_response import SuccessResponse
from core.classes.parameters_identification.parameters import PIParameters
from core.classes.parameters_identification.result import PIResult
from core.definitions.common.processing_type import ProcessingType
from core.definitions.parameters_identification.success_response import \
    PISuccessResponseDefinition


class PISuccessResponse(SuccessResponse[ProcessingType.PI, PIParameters, PIResult]):
    """PI Success Response"""

    @property
    def definition(self) -> PISuccessResponseDefinition:
        """Definition"""

        return {
            "type": self.type.value,
            "parameters": self.parameters.definition,
            "result": self.result.definition,
        }

    def __init__(self, definition: PISuccessResponseDefinition) -> None:
        super().__init__(
            ProcessingType.PI,
            PIParameters(definition["parameters"]),
            PIResult(definition["result"]),
        )
