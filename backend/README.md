There are instructions for starting backend locally and entirely within docker.  

# Locally
To start up backend server locally:
  1. First start up a python virtual environment `python -m venv venv` and run `source venv/bin/activate`
  2. Install dependencies: i.e. run `pip install -r requirements.txt`
  3. Make sure you have docker installed.
  4. Set up the docker container:
      ```
      docker run --name [insert_docker_container_name] \
        -e POSTGRES_USER=[insert_username] \
        -e POSTGRES_PASSWORD=[insert_password] \
        -e POSTGRES_DB=[insert_database_name] \
        -p 5432:5432 -d postgres
      ```
  5. Create .env file in the current directory with the following:
    ```FLASK_SQLALCHEMY_DATABASE_URI=postgresql://[insert_username]:[insert_password]@db:5432/[insert_database_name]```
  6. Run the Flask server: `python app.py`; I think we need to run `flask run`

Installing dependencies
  0. Make sure you are in the virtual environment with all packages already installed (`pip install -r requirements.txt`)
  1. Run `pip install <package-name>`
  2. Run `pip freeze > requirements.txt`

Checking Postgres Manually: `docker exec -it [insert_docker_container_name] psql -U [insert_username] -d [insert_database_name]`
- Show tables: `\dt`
- Exit: `\q`
- Table info: `\d [insert_table_name]`
- See table data: `SELECT * FROM [insert_table_name];`

To Add/Edit Tables in Database:
- Create new tables under the models folder
- Run 1 migration per table so it's easier to rollback changes!
- Make sure to include the model in app.py and then run the following
```
flask db migrate -m "Add message describing changes"
flask db upgrade
```

To Undo a Database Migration:
```
flask db downgrade
```
- If you want to get rid of a migration permanently, make sure to delete the migration file under migrations; if you just want to edit a migration (eg. change table name or field name), you can just edit the migration file (make sure you ran the downgrade command first!!) and then upgrade again

# Within Docker
To start up backend server within Docker:
  1. Make sure you have docker installed.
  2. Create .env file in the current directory with the following:
     ```
     POSTGRES_USER=[insert_username]
     POSTGRES_PASSWORD=[insert_password]
     POSTGRES_DB=[insert_database_name]
     FLASK_SQLALCHEMY_DATABASE_URI=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
     JWT_SECRET_KEY=[insert_jwt_secret_key]
     ```
  3. Run `docker compose up` to start the backend.

Additional notes:
  * To start with docker terminal: 
    * `docker-compose up -d`
    * `docker compose exec backend bash`
  * You can then run `python app.py`
  * Checking Postgres manually within Docker
    1. `apt-get update`
    2. `apt-get install -y postgresql-client`
    3. `psql -h db -U [insert_username] -d [insert_database_name]`
  * Add/Edit Tables in Database is same as above but in docker backend bash.
  * To take down backend `docker compose down`.

# Additional NOTES
- Make sure to turn off Airplay Receiver on Mac. It uses port 5000 as well.
- Please run `black .` and `isort .` before making a pr :)
- To exit virtual environment, run `deactivate`
