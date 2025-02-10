"""Success Response Class"""

from typing import Generic, TypeVar

# pylint: disable=invalid-name
ProcessingType = TypeVar("ProcessingType")
ParametersType = TypeVar("ParametersType")
ResultType = TypeVar("ResultType")
# pylint: enable=invalid-name


class SuccessResponse(Generic[ProcessingType, ParametersType, ResultType]):
    """Success response"""

    type: ProcessingType
    parameters: ParametersType
    result: ResultType

    @property
    def definition(self) -> None:
        """Definition"""

        raise NotImplementedError

    def __init__(
        self,
        processing_type: ProcessingType,
        parameters: ParametersType,
        result: ResultType,
    ) -> None:
        self.type = processing_type
        self.parameters = parameters
        self.result = result
