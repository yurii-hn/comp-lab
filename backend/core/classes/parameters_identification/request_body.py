"""Parameter Identification Request Body Class"""

from core.classes.model.model import Model
from core.classes.parameters_identification.parameters import PIParameters
from core.definitions.parameters_identification.request_body import \
    PIRequestBodyDefinition


class PIRequestBody:
    """PI Request Body"""

    parameters: PIParameters
    model: Model

    @property
    def definition(self) -> PIRequestBodyDefinition:
        """Definition"""

        return {
            "parameters": self.parameters.definition,
            "model": self.model.definition,
        }

    def __init__(self, definition: PIRequestBodyDefinition) -> None:
        self.parameters = PIParameters(definition["parameters"])
        self.model = Model(definition["model"])
