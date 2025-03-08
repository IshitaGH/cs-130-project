# Welcome to Roomies
Roomies is a mobile app that improves communication between roommates at every step. From chores lists that automatically update to an expense tracker that simplifies settling roommate-related expenses, Roomies aims to streamline the roommate experience, reduce conflicts, and help promote a peaceful and healthy atmosphere.

## Setup
See `frontend/README.md` and `backend/README.md` for help setting up the project locally for development. `frontend/` is the client app built with React Native, and `backend/` stores the backend service built with Docker, Flask, and Postgres. 

## Local Development with Public WiFi
- Use `ngrok` to generate a public URL for your local backend app
  - Copy the public URL into `frontend/config.ts` (see `frontend/README.md` for more details on this)

## Directory Structure

```
cs-130-project/
├── frontend/                   # React Native mobile application
│   ├── app/                   # Main application routes
│   │   ├── (auth)/           # Authentication related screens
│   │   ├── (room)/           # Room management screens
│   │   ├── (app)/            # Main app screens (home, chores, expenses)
│   │   └── _layout.tsx       # Root layout configuration
│   ├── assets/               # Static assets like images
│   ├── contexts/             # React context providers
│   ├── hooks/                # Custom React hooks
│   ├── utils/                # Utility functions and API clients
│   └── __tests__/           # Frontend test suite
│
├── backend/                   # Flask server application
│   ├── models/               # Database models and schemas
│   ├── routes/               # API route handlers
│   ├── migrations/           # Database migration files
│   ├── __tests__/           # Backend test suite
│   ├── app.py               # Main application entry
│   └── database.py          # Database configuration
```

The project follows a modern full-stack architecture:
- **Frontend**: A React Native mobile app using Expo, with file-system based routing and TypeScript for type safety
- **Backend**: A Flask application with SQLAlchemy ORM, containerized with Docker and PostgreSQL database
