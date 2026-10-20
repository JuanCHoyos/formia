# Formly backend

## Requirements

Node.js 20 or newer and npm.

## Development

From this directory, install the dependencies and start the backend:

```bash
npm install
npm run dev
```

The API listens on `http://localhost:3000` with the `/api/v1` prefix.

## API

`GET /api/v1/users` returns a sample user:

```json
[{ "id": 1, "name": "Usuario de prueba" }]
```

## Production

```bash
npm run build
npm start
```