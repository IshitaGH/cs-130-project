# Backend Tests

This directory contains unit tests and integration tests for the backend functionality, focusing on chores management.

## Test Structure

The tests are organized into test files:

### Chores Tests (`test_chores.py`)
1. **Unit Tests**
   - `test_rotate_chore_daily`: Tests daily chore rotation logic
   - `test_rotate_chore_weekly`: Tests weekly chore rotation logic
   - `test_rotate_chore_monthly`: Tests monthly chore rotation logic

2. **Integration Tests**
   - `test_get_chores`: Tests GET /chores endpoint
   - `test_create_chore`: Tests POST /chores endpoint
   - `test_update_chore`: Tests PUT /chores endpoint
   - `test_delete_chore`: Tests DELETE /chores endpoint
   - `test_create_recurring_chore`: Tests creating chores with rotation
   - `test_unauthorized_access`: Tests authentication requirements

### Notification Tests (`test_notifications.py`)
1. **Integration Tests**
   - `test_get_notification_by_id`: Tests GET /notifications endpoint to retrieve a notification by its ID
   - `test_get_notification_by_sender`: Tests GET /notifications endpoint to retrieve a notification by its sender ID
   - `test_get_notification_by_recipient`: Tests GET /notifications endpoint to retrieve a notification by its recipient ID
   - `test_get_notification_by_sender_and_recipient`: Tests GET /notifications endpoint to retrieve a notification by its sender and recipient ID
   - `test_get_all_notifications`: Tests GET /notifications endpoint without any filters
   - `test_create_notification`: Tests POST /notifications endpoint
   - `test_update_notification`: Tests PUT /notifications endpoint
   - `test_delete_notification`: Tests DELETE /notifications endpoint

## Prerequisites

Make sure you have the following installed:
- Python 3.8 or higher
- Docker and Docker Compose
- PostgreSQL (for local development)

All Python dependencies, including pytest and pytest-cov, are listed in requirements.txt and will be installed during setup.

### Setting up the Test Environment

1. First, make sure you're in the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python3 -m venv venv
```

3. Activate the virtual environment:
```bash
source venv/bin/activate  # On macOS/Linux
# or
.\venv\Scripts\activate  # On Windows
```

4. Install the project dependencies (including test dependencies):
```bash
pip install -r requirements.txt
```

5. Start the PostgreSQL container:
```bash
docker-compose up -d db
```

6. Create the test database:
```bash
docker exec backend_db_1 psql -U myuser postgres -c "CREATE DATABASE test_database;"
```

Note: The container name (`backend_db_1`) might be different on your system. To find your container name, run:
```bash
docker ps
```
Look for the container running PostgreSQL and use that name in the command above.

When you're done testing, you can deactivate the virtual environment by running:
```bash
deactivate
```

And stop the Docker containers:
```bash
docker-compose down
```

## Running the Tests

Make sure your virtual environment is activated (you should see `(venv)` at the start of your terminal prompt) and the PostgreSQL container is running before running tests.

### Understanding PYTHONPATH

The tests need to import modules from the backend directory (like `app.py`, `models`, etc.). By default, Python looks for modules in the current directory and Python's installed packages, but not in parent directories. This is why you might see errors like:

```
ModuleNotFoundError: No module named 'app'
```

To fix this, we need to add the backend directory to Python's module search path using the `PYTHONPATH` environment variable. This tells Python where to look for the modules that our tests need to import.

### Running Test Commands

1. **Run all tests**:
```bash
PYTHONPATH=/path/to/your/backend pytest __tests__/ -v
```

Replace `/path/to/your/backend` with the actual path to your backend directory. For example:
```bash
PYTHONPATH=/Users/username/projects/cs-130-project/backend pytest __tests__/ -v
```

2. **Run specific test file**:
```bash
PYTHONPATH=/path/to/your/backend pytest __tests__/test_chores.py -v

```

3. **Run with coverage report**:
```bash
PYTHONPATH=/path/to/your/backend pytest __tests__/ --cov=routes --cov-report=term-missing
```

4. **Run specific test**:
```bash
PYTHONPATH=/path/to/your/backend pytest __tests__/test_chores.py -v -k "test_create_chore"

```

## Test Database

The tests use a dedicated PostgreSQL database named `test_database`. While SQLite is often used for testing due to its simplicity and in-memory capabilities, we specifically use PostgreSQL for our tests for several reasons:

1. **Production Parity**: Our production environment uses PostgreSQL, so testing with the same database type helps catch compatibility issues early.
2. **Feature Support**: PostgreSQL supports features that SQLite doesn't, such as:
   - Array columns (which we use for `rotation_order` in the Chore model)
   - More complex JSON operations
   - Better concurrency handling
3. **Reliability**: Using the same database type in testing and production reduces the risk of tests passing locally but failing in production due to database differences.

The database is automatically set up and cleaned between tests using pytest fixtures, and the configuration is handled through environment variables in the test files.

## Test Data

The tests use fixtures that set up:
- A test room
- Two test roommates
- Sample chores

These fixtures are automatically used by the integration tests to provide a consistent test environment.

## Authentication

The integration tests automatically handle JWT token generation for authenticated endpoints. The tokens are created using the test roommate's ID and included in the request headers.

## Adding New Tests

When adding new tests:
1. Create a new test file in the `__tests__` directory
2. Follow the existing pattern of separating unit tests and integration tests
3. Use the provided fixtures (`client` and `test_data`)
4. Follow the existing pattern for authentication when testing protected endpoints
5. Update this README to include the new test file and its tests

## Common Issues

1. **Database Connection Errors**: 
   - Make sure the PostgreSQL container is running (`docker ps`)
   - Verify the test database exists (`docker exec -it backend_db_1 psql -U myuser -l`)
   - Check that the database URL in the test file matches your setup

2. **Import Errors**: 
   - Ensure the PYTHONPATH is correctly set to your backend directory
   - Verify all required packages are installed
   - Make sure you're running pytest from the backend directory

3. **Authentication Errors**: 
   - Verify that the JWT secret key is properly set in the test environment
   - Check that the token is being correctly generated and included in headers

4. **SQLAlchemy Warnings**:
   - The current version uses some deprecated SQLAlchemy methods
   - These warnings don't affect functionality but will be addressed in future updates

## Cleaning Up

After running tests, you can:
1. Stop the PostgreSQL container:
```bash
docker-compose down
```

2. Drop the test database if needed:
```bash
docker exec -it backend_db_1 psql -U myuser -c "DROP DATABASE test_database;"
```

3. Deactivate the virtual environment:
```bash
deactivate
``` 