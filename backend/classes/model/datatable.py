from classes.common.data import Data
from classes.common.values import Values


class Datatable:
    compartments: dict[str, Values]
    constants: dict[str, Values]
    interventions: dict[str, Values]
    lambdas: dict[str, Values]

    @property
    def compartments_data(self) -> dict[str, Data]:
        return {
            name: {
                "times": data.times.tolist(),
                "values": data.values.tolist(),
            }
            for name, data in self.compartments.items()
        }

    @property
    def constants_data(self) -> dict[str, Data]:
        return {
            name: {
                "times": data.times.tolist(),
                "values": data.values.tolist(),
            }
            for name, data in self.constants.items()
        }

    @property
    def interventions_data(self) -> dict[str, Data]:
        return {
            name: {
                "times": data.times.tolist(),
                "values": data.values.tolist(),
            }
            for name, data in self.interventions.items()
        }

    @property
    def lambdas_data(self) -> dict[str, Data]:
        return {
            name: {
                "times": data.times.tolist(),
                "values": data.values.tolist(),
            }
            for name, data in self.lambdas.items()
        }

    def __init__(self) -> None:
        self.compartments = {}
        self.constants = {}
        self.interventions = {}
        self.lambdas = {}

    def __getitem__(self, key: str) -> Values:
        if key in self.compartments:
            return self.compartments[key]

        if key in self.constants:
            return self.constants[key]

        if key in self.interventions:
            return self.interventions[key]

        if key in self.lambdas:
            return self.lambdas[key]

        raise KeyError(f'Key "{key}" not found in Datatable')

    def set_compartments(self, compartments: dict[str, Values]) -> None:
        self.compartments = compartments

    def update_compartments(self, compartments: dict[str, Values]) -> None:
        self.compartments.update(compartments)

    def set_constants(self, constants: dict[str, Values]) -> None:
        self.constants = constants

    def update_constants(self, constants: dict[str, Values]) -> None:
        self.constants.update(constants)

    def set_interventions(self, interventions: dict[str, Values]) -> None:
        self.interventions = interventions

    def update_interventions(self, interventions: dict[str, Values]) -> None:
        self.interventions.update(interventions)

    def set_lambdas(self, lambdas: dict[str, Values]) -> None:
        self.lambdas = lambdas

    def update_lambdas(self, lambdas: dict[str, Values]) -> None:
        self.lambdas.update(lambdas)
