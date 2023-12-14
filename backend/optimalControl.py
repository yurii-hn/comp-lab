from sympy import Symbol, sympify, lambdify, solve, diff


def optimalControl(payload):
    eps = 1e-3
    iterations = 0

    # Initialize the data dictionary
    data = {}

    # Setting output init data
    data['time'] = payload['simulationParameters']['time']
    data['step'] = payload['simulationParameters']['step']
    data['compartments'] = []

    payload['symbolsTable'] = {}

    # Put symbols in the payload
    for i in range(len(payload['model'])):
        compartmentName = payload['model'][i]['name']

        payload['symbolsTable'][compartmentName] = Symbol(compartmentName)

    for i in range(len(payload['interventions'])):
        interventionName = payload['interventions'][i]['name']

        payload['symbolsTable'][interventionName] = Symbol(interventionName)

    simulationNodesAmount = data['time'] / data['step']

    compartmentsEquations = getCompartmentsEquations(payload)

    for i in range(len(payload['model'])):
        payload['model'][i]['values'] = [payload['model'][i]['value']] + \
            [0] * int(simulationNodesAmount - 1)
        payload['model'][i]['equation'] = compartmentsEquations[i]

    payload['costFunction'] = getCostFunction(payload)
    payload['hamiltonian'] = getHamiltonian(payload)

    interventionDerivatives = getInterventionDerivatives(payload)

    for i in range(len(payload['interventions'])):
        payload['interventions'][i]['values'] = [
            0] * int(simulationNodesAmount)
        payload['interventions'][i]['equation'] = interventionDerivatives[i]

    lambdaDerivatives = getLambdaDerivatives(payload)

    payload['lambdas'] = []

    for i in range(len(payload['model'])):
        payload['lambdas'].append({
            'values': [0] * int(simulationNodesAmount),
            'equation': lambdaDerivatives[i]
        })

    simulationResults = SIROptimised(payload)

    for i in range(len(payload['model'])):
        payload['model'][i]['values'] = simulationResults[i]['values']

    previousCost = 0
    currentCost = costFunction(payload)

    while True:
        newLambdas = lambdaSystem(payload)

        for i in range(len(payload['model'])):
            payload['lambdas'][i]['values'] = newLambdas[i]

        interventionValues = updateUFunctions(payload)

        for i in range(len(payload['interventions'])):
            payload['interventions'][i]['values'] = interventionValues[i]

        for i in range(len(payload['model'])):
            payload['model'][i]['values'] = [payload['model'][i]['value']] + \
                [0] * int(simulationNodesAmount - 1)

        simulationResults = SIROptimised(payload)

        for i in range(len(payload['model'])):
            payload['model'][i]['values'] = simulationResults[i]['values']

        previousCost = currentCost
        currentCost = costFunction(payload)

        iterations += 1

        if abs(currentCost - previousCost) <= eps:
            break

    for i in range(len(payload['model'])):
        data['compartments'].append({
            'name': payload['model'][i]['name'],
            'values': payload['model'][i]['values']
        })

    for i in range(len(payload['interventions'])):
        data['compartments'].append({
            'name': payload['interventions'][i]['name'],
            'values': payload['interventions'][i]['values']
        })

    return data


def SIROptimised(payload):
    variablesData = getVariablesData(payload)

    for t in range(
        int(payload['simulationParameters']['time'] /
            payload['simulationParameters']['step']) - 1
    ):
        for i in range(len(payload['model'])):
            compartmentName = payload['model'][i]['name']
            values = [0] * len(payload['model'][i]['equation']['vars'])

            for j in range(len(payload['model'][i]['equation']['vars'])):
                values[j] = variablesData[str(payload['model']
                                          [i]['equation']['vars'][j])][t]

            variablesData[compartmentName][t + 1] = variablesData[compartmentName][t] + \
                payload['model'][i]['equation']['equation'](*values)

    modelData = []

    for i in range(len(payload['model'])):
        modelData.append({
            'name': payload['model'][i]['name'],
            'values': variablesData[payload['model'][i]['name']]
        })

    return modelData


def lambdaSystem(payload):
    variablesData = getVariablesData(payload)

    for t in range(int(payload['simulationParameters']['time'] / payload['simulationParameters']['step'] - 2), -1, -1):
        for i in range(len(payload['model'])):
            lambdaName = 'lambda' + str(i)
            values = [0] * len(payload['lambdas'][i]['equation']['vars'])

            for j in range(len(payload['lambdas'][i]['equation']['vars'])):
                values[j] = variablesData[str(payload['lambdas']
                                          [i]['equation']['vars'][j])][t + 1]

            variablesData[lambdaName][t] = variablesData[lambdaName][t + 1] - \
                payload['lambdas'][i]['equation']['equation'](*values)

    lambdas = []

    for i in range(len(payload['model'])):
        lambdas.append(variablesData['lambda' + str(i)])

    return lambdas


def updateUFunctions(payload):
    variablesData = getVariablesData(payload)

    for t in range(int(payload['simulationParameters']['time'] / payload['simulationParameters']['step'])):
        for i in range(len(payload['interventions'])):
            interventionName = payload['interventions'][i]['name']
            values = [0] * len(payload['interventions'][i]['equation']['vars'])

            for j in range(len(payload['interventions'][i]['equation']['vars'])):
                values[j] = variablesData[str(payload['interventions']
                                          [i]['equation']['vars'][j])][t]

            variablesData[interventionName][t] = min(
                0.9, max(0, payload['interventions'][i]['equation']['equation'](*values)))

    interventions = []

    for i in range(len(payload['interventions'])):
        interventions.append(variablesData[payload['interventions'][i]['name']])

    return interventions


def costFunction(payload):
    variablesData = getVariablesData(payload)

    cost = 0

    for t in range(int(payload['simulationParameters']['time'] / payload['simulationParameters']['step'])):
        values = [0] * len(payload['costFunction']['vars'])

        for i in range(len(payload['costFunction']['vars'])):
            values[i] = variablesData[str(
                payload['costFunction']['vars'][i])][t]

        cost += payload['costFunction']['equation'](*values)

    return cost


def getVariablesData(payload):
    variablesData = {}

    for i in range(len(payload['model'])):
        variablesData[payload['model'][i]['name']
                      ] = payload['model'][i]['values']
        variablesData['lambda' + str(i)] = payload['lambdas'][i]['values']

    for i in range(len(payload['interventions'])):
        variablesData[payload['interventions'][i]['name']
                      ] = payload['interventions'][i]['values']

    return variablesData


def getHamiltonian(payload):
    hamiltonianEquation = payload['costFunction']['symbolicEquation']

    for i in range(len(payload['model'])):
        hamiltonianEquation += Symbol('lambda' + str(i)) * \
            payload['model'][i]['equation']['symbolicEquation']

    return {
        'vars': list(hamiltonianEquation.free_symbols),
        'equation': lambdify(hamiltonianEquation.free_symbols, hamiltonianEquation),
        'symbolicEquation': hamiltonianEquation,
    }


def getCostFunction(payload):
    costFunctionEquation = sympify(payload['costFunction'].replace(
        '^', '**'), payload['symbolsTable'])

    return {
        'vars': list(costFunctionEquation.free_symbols),
        'equation': lambdify(costFunctionEquation.free_symbols, costFunctionEquation),
        'symbolicEquation': costFunctionEquation,
    }


def getCompartmentsEquations(payload):
    equations = []

    for i in range(len(payload['model'])):
        compartmentEquation = 0

        for j in range(len(payload['model'][i]['inflows'])):
            compartmentEquation += sympify(payload['model'][i]['inflows'][j].replace(
                '^', '**'), payload['symbolsTable'])

        for j in range(len(payload['model'][i]['outflows'])):
            compartmentEquation -= sympify(payload['model'][i]['outflows'][j].replace(
                '^', '**'), payload['symbolsTable'])

        equation = {
            'vars': list(compartmentEquation.free_symbols),
            'equation': lambdify(compartmentEquation.free_symbols, compartmentEquation),
            'symbolicEquation': compartmentEquation,
        }

        equations.append(equation)

    return equations


def getLambdaDerivatives(payload):
    lambdaDerivatives = []

    for i in range(len(payload['model'])):
        lambdaDerivative = - diff(
            payload['hamiltonian']['symbolicEquation'],
            payload['symbolsTable'][payload['model'][i]['name']]
        )

        derivative = {
            'vars': list(lambdaDerivative.free_symbols),
            'equation': lambdify(lambdaDerivative.free_symbols, lambdaDerivative),
            'symbolicEquation': lambdaDerivative,
        }

        lambdaDerivatives.append(derivative)

    return lambdaDerivatives


def getInterventionDerivatives(payload):
    derivatives = []

    for i in range(len(payload['interventions'])):
        interventionDerivative = solve(
            diff(
                payload['hamiltonian']['symbolicEquation'],
                payload['symbolsTable'][payload['interventions'][i]['name']]
            ),
            payload['symbolsTable'][payload['interventions'][i]['name']]
        )[0]

        derivative = {
            'vars': list(interventionDerivative.free_symbols),
            'equation': lambdify(interventionDerivative.free_symbols, interventionDerivative),
            'symbolicEquation': interventionDerivative,
        }

        derivatives.append(derivative)

    return derivatives
