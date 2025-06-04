"""Values Class"""

from bisect import bisect_right
from core.classes.common.point import Point
from core.definitions.common.approximation_type import ApproximationType
from core.definitions.common.point import PointDefinition
from core.definitions.common.values import ValuesDefinition
import numpy as np
import numpy.typing as npt


class Values:
    """Values"""

    name: str
    times: npt.NDArray[np.float64]
    values: npt.NDArray[np.float64]
    approximation_type: ApproximationType

    @property
    def definition(self) -> ValuesDefinition:
        """Definition"""

        return {
            "name": self.name,
            "values": [
                {"time": t, "value": v} for t, v in zip(self.times, self.values)
            ],
        }

    def __init__(
        self,
        definition: ValuesDefinition,
        approximation_type: ApproximationType = ApproximationType.PIECEWISE_LINEAR,
    ) -> None:
        points: list[PointDefinition] = definition["values"]
        points.sort(key=lambda point: point["time"])

        self.name = definition["name"]
        self.times = np.asarray([point["time"] for point in points], dtype=np.float64)
        self.values = np.asarray([point["value"] for point in points], dtype=np.float64)
        self.approximation_type = approximation_type

    def __call__(self, time: float) -> float:
        """Get value at time"""

        times = self.times
        values = self.values

        if values.size == 0:
            return 0

        index: int = bisect_right(times, time)

        if index == 0:
            return values[0]

        if index == times.size:
            return values[-1]

        if self.approximation_type == ApproximationType.PIECEWISE_CONSTANT:
            return values[index - 1]

        elif self.approximation_type == ApproximationType.PIECEWISE_LINEAR:
            time_left: float = times[index - 1]
            time_right: float = times[index]
            value_left: float = values[index - 1]
            value_right: float = values[index]

            return (time_right - time) / (time_right - time_left) * value_left + (
                time - time_left
            ) / (time_right - time_left) * value_right

        else:
            raise ValueError("Approximation type not supported")
