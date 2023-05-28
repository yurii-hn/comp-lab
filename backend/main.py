from flask import Flask, request, jsonify
import json
import matlab.engine
import numpy as np

eng = matlab.engine.start_matlab()
eng.cd(r'../matlab', nargout=0)

app = Flask(__name__)

@app.route('/simulate', methods=['POST'])
def simulate():
    data = request.get_json()

    result = eng.simulate(str(data).replace("'", '"'))

    return getResponseJSON(result)

@app.route('/optimalControl', methods=['POST'])
def optimalControl():
    data = request.get_json()

    result = eng.optimalControl(str(data).replace("'", '"'))

    return getResponseJSON(result)

if __name__ == '__main__':
    app.run(debug=True)

def getResponseJSON(responseObj):
    for i in range(len(responseObj['compartments'])):
        responseObj['compartments'][i]['values'] = np.array(responseObj['compartments'][i]['values']).flatten().tolist()

    string = str(responseObj).replace("'", '"')

    obj = json.loads(string)

    return jsonify(obj)
