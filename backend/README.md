There are instructions for starting backend entirely within docker.  

## Start Backend Server within Docker
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
  3. Run `docker-compose up` to start the backend.

## Open docker terminal
  1. `docker-compose up -d`
  2. `docker-compose exec backend bash`
  * Checking Postgres manually within Docker (updates & installations should persist)
    1. `apt-get update`
    2. `apt-get install -y postgresql-client`
    3. `psql -h db -U [insert_username] -d [insert_database_name]`
    * To Add/Edit Tables in Database (inside docker terminal):
      - Show tables: `\dt`
      - Exit: `\q`
      - Table info: `\d [insert_table_name]`
      - See table data: `SELECT * FROM [insert_table_name];`
      - Create new tables under the models folder
      - Run 1 migration per table so it's easier to rollback changes!
      - Make sure to include the model in app.py and then run the following:
        ```
        flask db migrate -m "Add message describing changes"
        flask db upgrade
        ```

      - To Undo a Database Migration:
        ```
        flask db downgrade
        ```
      - If you want to get rid of a migration permanently, make sure to delete the migration file under migrations; if you just want to edit a migration (eg. change table name or field name), you can just edit the migration file (make sure you ran the downgrade command first!!) and then upgrade again
  * To take down backend `docker compose down`.

# Additional NOTES
- Make sure to turn off Airplay Receiver on Mac. It uses port 5000 as well.
- Please run `black .` and `isort .` in the backend folder before making a pr :)
- To exit virtual environment, run `deactivate`
