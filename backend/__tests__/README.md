# Backend Test Suite

The test suite includes:
- Unit tests for core functionality (e.g., chore rotation logic)
- Integration tests for API endpoints
- Fixtures for setting up test data

## Running Tests

To run the test suite, use Docker Compose with the test configuration:

```bash
docker compose -f docker-compose.test.yml up --build --exit-code-from backend-test
```

This command will:
1. Build the necessary Docker containers
2. Run the test suite
3. Exit with the appropriate exit code based on test results

## Test Structure

### Test Files

- `test_chores.py`: Tests for chore-related functionality including API endpoints and rotation logic
- `test_expenses_api.py`: Tests expenses API endpoints
- `test_notifications.py`: Tests for notification API endpoints
- `test_utils.py`: Utility functions to support testing

### Key Components

#### Fixtures

The test suite uses pytest fixtures to set up test data, including:
- Test rooms
- Test roommates
- Test chores
- Test notifications
