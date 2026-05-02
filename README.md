# Smart IoT Monitoring System — Frontend

Angular SPA for authentication, profile management, and the authenticated home shell. Built with **Angular 21** (standalone components), **Angular Material**, and **Vitest** for unit tests.

## Prerequisites

- **Node.js** (LTS recommended)
- **npm** (this repo pins `npm@10.9.2` in `package.json`)

## Quick start

```bash
npm install
npm start
```

Open [http://localhost:4200](http://localhost:4200). The dev server reloads when source files change.

Equivalent: `ng serve`

## API configuration

The app talks to the backend using `environment.apiUrl` (e.g. `http://localhost:8080/api`).

| File                                          | When it applies                                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `src/environments/environment.development.ts` | `ng serve` and `ng build --configuration development` (via `fileReplacements` in `angular.json`) |
| `src/environments/environment.ts`             | Production / default builds                                                                      |

- `useMock` — When `true` in the active environment, an HTTP interceptor serves in-app mock responses for auth and profile routes so you can develop without a running backend. Set to `false` to use the real API (adjust `apiUrl` to match your backend).

To run the app without a backend, set `useMock: true` in `src/environments/environment.development.ts`. The mock interceptor handles all auth and profile endpoints.

Bearer tokens are stored in `localStorage` and attached by the auth interceptor, except on public `POST /auth/login` and `POST /auth/register` requests.

## Routes (overview)

| Path                | Notes                   |
| ------------------- | ----------------------- |
| `/signup`, `/login` | Public                  |
| `/home`, `/profile` | Protected (`authGuard`) |
| `/**`               | 404 not-found           |

Default route `/` redirects to `/signup`.

## Scripts

| Command         | Description                     |
| --------------- | ------------------------------- |
| `npm start`     | Dev server (`ng serve`)         |
| `npm run build` | Production build (`ng build`)   |
| `npm run watch` | Development build in watch mode |
| `npm test`      | Unit tests (`ng test`, Vitest)  |

## Unit tests

```bash
npm test
```

Uses the Angular application builder’s Vitest integration (`@angular/build:unit-test`).

## Production build

```bash
ng build
```

Output is under `dist/`. Use your hosting/CDN pipeline to deploy the browser bundle.

## QA handoff

For local testing, mock users, and expected behaviors (including profile flows), see **[docs/qa-local.md](docs/qa-local.md)**.

## Further reading

- [Angular CLI](https://angular.dev/tools/cli)
- [Angular documentation](https://angular.dev)
