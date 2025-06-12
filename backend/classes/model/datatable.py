from classes.common.data import Data
from classes.common.values import Values


class Datatable:
    _compartments: dict[str, Values]
    _constants: dict[str, Values]
    _interventions: dict[str, Values]
    _lambdas: dict[str, Values]

    @property
    def compartments_data(self) -> dict[str, Data]:
        return {
            name: {
                "times": data.times.tolist(),
                "values": data.values.tolist(),
            }
            for name, data in self._compartments.items()
        }

    @property
    def constants_data(self) -> dict[str, Data]:
        return {
            name: {
                "times": data.times.tolist(),
                "values": data.values.tolist(),
            }
            for name, data in self._constants.items()
        }

    @property
    def interventions_data(self) -> dict[str, Data]:
        return {
            name: {
                "times": data.times.tolist(),
                "values": data.values.tolist(),
            }
            for name, data in self._interventions.items()
        }

    @property
    def lambdas_data(self) -> dict[str, Data]:
        return {
            name: {
                "times": data.times.tolist(),
                "values": data.values.tolist(),
            }
            for name, data in self._lambdas.items()
        }

    def __init__(self) -> None:
        self._compartments = {}
        self._constants = {}
        self._interventions = {}
        self._lambdas = {}

    def __getitem__(self, key: str) -> Values:
        if key in self._compartments:
            return self._compartments[key]

        if key in self._constants:
            return self._constants[key]

        if key in self._interventions:
            return self._interventions[key]

        if key in self._lambdas:
            return self._lambdas[key]

        raise KeyError(f'Key "{key}" not found in Datatable')

    def set_compartments(self, compartments: dict[str, Values]) -> None:
        self._compartments = compartments

    def update_compartments(self, compartments: dict[str, Values]) -> None:
        self._compartments.update(compartments)

    def set_constants(self, constants: dict[str, Values]) -> None:
        self._constants = constants

    def update_constants(self, constants: dict[str, Values]) -> None:
        self._constants.update(constants)

    def set_interventions(self, interventions: dict[str, Values]) -> None:
        self._interventions = interventions

    def update_interventions(self, interventions: dict[str, Values]) -> None:
        self._interventions.update(interventions)

    def set_lambdas(self, lambdas: dict[str, Values]) -> None:
        self._lambdas = lambdas

    def update_lambdas(self, lambdas: dict[str, Values]) -> None:
        self._lambdas.update(lambdas)
