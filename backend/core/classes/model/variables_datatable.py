"""Variables Datatable"""

from core.classes.common.point import Point
from core.classes.common.values import Values
from core.definitions.common.values import ValuesDefinition


class VariablesDatatable:
    """Variables Datatable"""

    _compartments: dict[str, Values]
    _constants: dict[str, Values]
    _interventions: dict[str, Values]
    _lambdas: dict[str, Values]

    @property
    def compartments_definition(self) -> list[ValuesDefinition]:
        """Compartments Definition"""

        return [compartment.definition for compartment in self._compartments.values()]

    @property
    def constants_definition(self) -> list[ValuesDefinition]:
        """Constants Definition"""

        return [constant.definition for constant in self._constants.values()]

    @property
    def interventions_definition(self) -> list[ValuesDefinition]:
        """Interventions Definition"""

        return [intervention.definition for intervention in self._interventions.values()]

    @property
    def lambdas_definition(self) -> list[ValuesDefinition]:
        """Lambdas Definition"""

        return [lambdas.definition for lambdas in self._lambdas.values()]

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

    def update_compartments(self, compartments: dict[str, Values]) -> None:
        """Update compartments"""

        self._compartments = compartments

    def update_constants(self, constants: dict[str, Values]) -> None:
        """Update constants"""

        self._constants = constants

    def update_interventions(self, interventions: dict[str, Values]) -> None:
        """Update interventions"""

        self._interventions = interventions

    def update_lambdas(self, lambdas: dict[str, Values]) -> None:
        """Update lambdas"""

        self._lambdas = lambdas
