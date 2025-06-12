import numpy as np
import numpy.typing as npt
from scipy.integrate import solve_ivp

from classes.common.values import Values
from classes.model.datatable import Datatable
from classes.optimal_control.adjoint_model import AdjointModel


def simulate_adjoint(
    model: AdjointModel,
    times: npt.NDArray[np.float64],
    variables_datatable: Datatable,
) -> None:
    result = solve_ivp(
        fun=__calculate_model,
        t_span=(times[-1], times[0]),
        y0=[0] * len(model["lambdas"]),
        args=(model, variables_datatable),
        method="LSODA",
        t_eval=np.flip(times),
    )

    variables_datatable.set_lambdas(
        {
            name: Values(
                result.t[::-1],
                result.y[i][::-1],
            )
            for i, name in enumerate(model["lambdas"])
        }
    )


def __calculate_model(
    t: np.float64,
    y: npt.NDArray[np.float64],
    model: AdjointModel,
    variables_datatable: Datatable,
) -> npt.NDArray[np.float64]:
    names = list(model["lambdas"].keys())
    lambdas = list(model["lambdas"].values())

    return np.array(
        [
            equation.calculate(
                np.array(
                    [
                        (
                            y[names.index(variable.name)]
                            if variable.name in model["lambdas"]
                            else variables_datatable[variable.name](t)
                        )
                        for variable in equation.variables
                    ],
                    dtype=np.float64,
                )
            )
            for equation in lambdas
        ],
        dtype=np.float64,
    )
