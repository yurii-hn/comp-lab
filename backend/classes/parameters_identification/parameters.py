from typing import TypedDict

from classes.common.data import Data
from classes.parameters_identification.selected_constant import SelectedConstant


class PIParameters(TypedDict):
    nodesAmount: int
    forecastTime: float
    selectedConstants: dict[str, SelectedConstant]
    data: dict[str, Data]
