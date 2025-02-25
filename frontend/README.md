Note: Store your device's current IP address in a .env.local file

- It will be read by process.env in apiClient.ts

# Welcome to Roomies Frontend 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

### Developer Notes
1. Export the URL of the backend app at `frontend/config.ts` as `API_URL`
   1. `frontend/apiClient.ts` will read this value to make API calls
   2. Using `localhost` may not work due to Flask's CORS policy
2. Use `npx prettier --write` to enforce the repositories code styling conventions
