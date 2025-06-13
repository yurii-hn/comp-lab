import numpy as np
import numpy.typing as npt
from scipy.integrate import solve_ivp

from classes.common.values import Values
from classes.model.runtime_compartment import RuntimeCompartment
from classes.model.runtime_model import RuntimeModel
from classes.model.datatable import Datatable


def simulate(
    model: RuntimeModel,
    times: npt.NDArray[np.float64],
    variables_datatable: Datatable,
) -> None:
    result = solve_ivp(
        fun=__calculate_model,
        t_span=(times[0], times[-1]),
        y0=[compartment["value"] for compartment in model["compartments"].values()],
        args=(model, variables_datatable),
        method="LSODA",
        t_eval=times,
    )

    if not all([y.min() >= -1e-6 for y in result.y]):
        compartment_index: int = next(
            i for i, y in enumerate(result.y) if y.min() < -1e-6
        )
        time_index: int = np.argmin(result.y[compartment_index]).item()

        time: np.float64 = result.t[time_index]
        compartment: RuntimeCompartment = list(model["compartments"].values())[
            compartment_index
        ]

        raise RuntimeError(f"Negative value for {compartment["name"]} at time {time}")

    variables_datatable.set_compartments(
        {
            name: Values(
                result.t,
                result.y[i],
            )
            for i, name in enumerate(model["compartments"])
        }
    )


def __calculate_model(
    t: np.float64,
    y: npt.NDArray[np.float64],
    model: RuntimeModel,
    variables_datatable: Datatable,
) -> npt.NDArray[np.float64]:
    names = list(model["compartments"].keys())
    compartments = list(model["compartments"].values())

    return np.array(
        [
            compartment["equation"].calculate(
                np.array(
                    [
                        (
                            y[names.index(variable.name)]
                            if variable.name in model["compartments"]
                            else variables_datatable[variable.name](t)
                        )
                        for variable in compartment["equation"].variables
                    ],
                    dtype=np.float64,
                )
            )
            for compartment in compartments
        ],
        dtype=np.float64,
    )
