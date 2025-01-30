from flask import Flask
from flask_cors import CORS

app = Flask(__name__)

# Allow all origins for development -> will need to change for production
CORS(app)

@app.route('/api/data')
def get_data():
    return {"message": "Hello, Roomies (this is from the Flask backend)!"}

if __name__ == '__main__':
    app.run(debug=True)  # Debug mode for auto-reloading