# Welcome to Roomies Frontend 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started locally

1. Make sure backend service is up and running. 
   - Export the URL of the backend app at `frontend/config.ts` (see `frontend/config-example.ts`)
      - Using `localhost` may not work due to Flask's CORS policy
      - If using public WiFi, you might need to create a tunnel to the backend with `ngrok` (e.g. `ngrok http 5000`)

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```
   - This command will generate a QR code that can be used on a physical device that has Expo Go installed.
   - Alternatively, you can use a custom development build (see https://docs.expo.dev/get-started/set-up-your-environment/?platform=ios&device=physical&mode=development-build&buildEnv=local)
   - If using public wifi, you might need to create a tunnel to the development server with the `--tunnel` option.

## Developer Notes
### Testing

To run the tests, use the following command:

```bash
npm test
```

### Additional
- Use `npx prettier --write` to enforce the repositories code styling conventions
