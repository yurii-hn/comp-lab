from flask import Flask, request, jsonify

from simulate import simulate
from optimalControl import optimalControl
from validateExpression import validateExpression

# Creating the application instance
app = Flask(__name__)


@app.route('/simulate', methods=['POST'])
def simulateEndpoint():
    """Simulation endpoint"""

    # Getting the data from the request
    data = request.get_json()

    # Simulating the system
    result = simulate(data)

    # Returning the result
    return jsonify(result)


@app.route('/optimal-control', methods=['POST'])
def optimalControlEndpoint():
    """Optimal control endpoint"""

    # Getting the data from the request
    data = request.get_json()

    # Solving the optimal control problem
    result = optimalControl(data)

    # Returning the result
    return jsonify(result)


@app.route('/validate-expression', methods=['POST'])
def validateExpressionEndpoint():
    """Expression validation endpoint"""

    # Getting the data from the request
    data = request.get_json()

    # Validating the expression
    result = validateExpression(data)

    # Returning the result
    return jsonify(result)


# Running the application
if __name__ == '__main__':
    app.run(debug=True)
