"""Parameters Identification Parameters Class"""

from core.classes.common.values import Values
from core.classes.parameters_identification.selected_constant import \
    SelectedConstant
from core.definitions.parameters_identification.parameters import \
    PIParametersDefinition


class PIParameters:
    """PI Parameters"""

    nodes_amount: int
    forecast_time: float
    selected_constants: list[SelectedConstant]
    data: list[Values]

    @property
    def definition(self) -> PIParametersDefinition:
        """Definition"""

        return {
            "nodesAmount": self.nodes_amount,
            "forecastTime": self.forecast_time,
            "selectedConstants": [
                selected_constant.definition
                for selected_constant in self.selected_constants
            ],
            "data": [data.definition for data in self.data],
        }

    def __init__(self, definition: PIParametersDefinition) -> None:
        self.nodes_amount = definition["nodesAmount"]
        self.forecast_time = definition["forecastTime"]
        self.selected_constants = [
            SelectedConstant(selected_constant)
            for selected_constant in definition["selectedConstants"]
        ]
        self.data = [Values(data) for data in definition["data"]]
