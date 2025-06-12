import numpy as np
import numpy.typing as npt

from classes.common.approximation_type import ApproximationType


class Values:
    times: npt.NDArray[np.float64]
    values: npt.NDArray[np.float64]
    approximation_type: ApproximationType

    def __init__(
        self,
        times: npt.NDArray[np.float64],
        values: npt.NDArray[np.float64],
        approximation_type: ApproximationType = ApproximationType.PIECEWISE_LINEAR,
    ) -> None:
        self.times = times
        self.values = values
        self.approximation_type = ApproximationType(approximation_type)

    def __call__(self, times: npt.ArrayLike) -> np.float64 | npt.NDArray[np.float64]:
        if self.values.size == 0:
            raise ValueError("There are no values")

        times = np.asarray(times, dtype=np.float64)
        indexes: npt.NDArray[np.intp] = np.searchsorted(self.times, times, "right")

        out: npt.NDArray[np.float64] = np.empty_like(times, dtype=np.float64)

        mask_before: npt.NDArray[np.bool] = indexes == 0
        mask_after: npt.NDArray[np.bool] = indexes >= self.times.size - 1
        mask_inside: npt.NDArray[np.bool] = ~(mask_before | mask_after)

        out[mask_before] = self.values[0]
        out[mask_after] = self.values[-1]

        if np.any(mask_inside):
            if self.approximation_type is ApproximationType.PIECEWISE_CONSTANT:
                out[mask_inside] = self.values[indexes[mask_inside] - 1]

            elif self.approximation_type is ApproximationType.PIECEWISE_LINEAR:
                left: npt.NDArray[np.intp] = indexes[mask_inside] - 1
                right: npt.NDArray[np.intp] = indexes[mask_inside]

                times_left, times_right = self.times[left], self.times[right]
                values_left, values_right = self.values[left], self.values[right]

                out[mask_inside] = (times_right - times[mask_inside]) / (
                    times_right - times_left
                ) * values_left + (times[mask_inside] - times_left) / (
                    times_right - times_left
                ) * values_right

            else:
                raise ValueError("Approximation type not supported")

        return np.float64(out.item()) if out.shape == () else out
