"""Parameters Identification Parameters Definition"""


from typing import TypedDict

from core.definitions.common.values import ValuesDefinition
from core.definitions.parameters_identification.selected_constant import \
    SelectedConstantDefinition


class PIParametersDefinition(TypedDict):
    """PI Parameters Definition"""

    nodesAmount: int
    selectedConstants: list[SelectedConstantDefinition]
    data: list[ValuesDefinition]
