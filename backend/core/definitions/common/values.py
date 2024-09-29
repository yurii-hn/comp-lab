"""Values Definition"""

from typing import TypedDict

from core.definitions.common.point import PointDefinition


class ValuesDefinition(TypedDict):
    """Values Definition"""

    name: str
    values: list[PointDefinition]
