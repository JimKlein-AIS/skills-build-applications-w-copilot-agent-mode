# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Pages stay thin and fetch only through the shared API client in `octofit-tracker/frontend/src/api`. Replace the `CapabilityCard` placeholder with loading, empty, accessible-alert, and data states. No authentication; it stays a follow-up challenge.
- Logic tier decision: Express routes in `backend/src` delegate to `backend/src/services/octofitService.ts`. Services validate input and return deliberate 4xx responses. Points, rankings, and suggestions are computed here, never in the UI or models.
- Data tier decision: Mongoose models own required-field validation (`User`, `Team`, `Activity`, `Workout`). Seed data stays in `src/scripts/seed.ts`. Derived values such as `points` and `occurredAt` are stored by the logic tier at creation time.
- Activity tracking approach: Validate `userId` and `teamId` as ObjectIds and confirm both exist before writing, returning `4xx` otherwise. Compute `points` from `type` and `minutes` with one rule in the service, and set `occurredAt` on creation.
- Team management approach: Reject a missing `name` with `400`. Store `name`, `mascot`, and `members` as submitted, and return them unchanged from `GET /api/teams`.
- Leaderboard approach: Aggregate activity points per team, sort descending, and add a 1-based `rank`. Teams with no activity still appear with `totalPoints: 0`.
- Workout suggestions approach: Look up the user by email and return `404` if none matches. Derive `focus` from the user's goal or most frequent recent activity type, and set `reason` to a sentence explaining that choice.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` runs `octofit-tracker/backend/tests/data.contract.test.ts`. A failure means a model is missing a required-field validator. Initially 4 of 5 tests fail; the seeding test passes.
- API command: `npm run test:api --prefix octofit-tracker/backend` runs `octofit-tracker/backend/tests/api.contract.test.ts`. A `501` means a service stub is still in place. A wrong status or body means a route or service does not yet meet the contract in the table above. Initially 4 of 4 tests fail.
- Frontend command: `npm test --prefix octofit-tracker/frontend` runs `octofit-tracker/frontend/tests/app.contract.test.tsx`. A failure that finds "Implementation pending" means the `CapabilityCard` placeholder is still rendered. Initially 15 of 15 tests fail.
- Backend build command: `npm run build --prefix octofit-tracker/backend` runs `tsc --noEmit`. A failure means a type error in the backend source or tests.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`. A failure means a type or bundling error in the frontend source.
