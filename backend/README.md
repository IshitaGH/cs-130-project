To start up backend server
  1. First start up a python virtual environment `python -m venv venv` and run `source venv/bin/activate`
  2. Install dependencies: i.e. run `pip install -r requirements.txt`
  3. Run the Flask server: `python app.py`

Installing dependencies
  0. Make sure you are in the virtual environment with all packages already installed (`pip install -r requirements.txt`)
  1. Run `pip install <package-name>`
  2. Run `pip freeze > requirements.txt`

To exit virtual environment, run `deactivate`


NOTE: Make sure to turn off Airplay Receiver on Mac. It uses port 5000 as well.
