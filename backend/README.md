# Welcome to Roomies Backend 👋

This is a backend service for the Roomies app built with Docker, Flask, and Postgres. 

## Get started locally
1. Make sure you have Docker installed
2. Create .env file in the current directory with the following:
     ```
     POSTGRES_USER=[insert_username]
     POSTGRES_PASSWORD=[insert_password]
     POSTGRES_DB=[insert_database_name]
     FLASK_SQLALCHEMY_DATABASE_URI=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
     JWT_SECRET_KEY=[insert_jwt_secret_key]
     ```
3. Run `docker compose up` to start the backend.
   - Note: Make sure to turn off Airplay Receiver on Mac. It uses port 5000 as well.
4. Run `docker compose down` to stop the backend containers.

## Developer Notes
### How to execute scripts inside Flask backend
1. `docker compose up -d`
2. `docker compose exec backend bash`
3. Execute any scripts: e.g. `flask shell`

### How to inspect database manually with `psql`
1. `docker compose up -d`
2. `docker compose exec backend db`
3. `psql -U $POSTGRES_USER` -d `POSTGRES_DB`

### Migrations
1. Exec into flask backend
2. Make changes to a database model and create the migration file: `flask db migrate -m "Add message describing changes"`
3. Migrate changes to the database: `flask db upgrade`
4. (Optional) Undo changes to database: `flask db downgrade`

### Additional
- Please run `black .` and `isort .` in the backend folder before making a pr :)
