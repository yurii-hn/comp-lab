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

    for i in range(len(result['compartments'])):
        result['compartments'][i]['values'] = np.array(result['compartments'][i]['values']).flatten().tolist()

    string = str(result).replace("'", '"')

    obj = json.loads(string)

    return jsonify(obj)

if __name__ == '__main__':
    app.run(debug=True)
