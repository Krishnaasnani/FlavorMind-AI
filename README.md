# RecipeFinder AI

RecipeFinder AI is a responsive recipe discovery app built around TheMealDB. Search by recipe name or ingredient, browse by category and area, save favourites, plan the week, and turn planned recipes into a persistent shopping list. Optional server-side Gemini integration powers the AI cooking assistant and recipe explanations.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TheMealDB](https://img.shields.io/badge/TheMealDB-Recipe%20API-6AAE3F)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI-4285F4)

## Key features

- Search TheMealDB by recipe name or ingredient.
- Browse recipes by category and area/cuisine.
- Get transparent, preference-aware recommendations from available recipes and favourites.
- Save and remove favourite recipes with browser persistence.
- Build a Monday–Sunday meal plan with breakfast, lunch, and dinner slots.
- Generate a shopping list from planned recipes, merge compatible ingredients, add manual items, and adjust quantities.
- Keep shopping-list data and checked state in `localStorage`.
- Use Ask AI Chef, ingredient substitutions, health explanations, and “Why this recipe?” explanations when an AI provider is configured.
- Responsive layout with light and dark themes.

## Tech stack

- React 19 and Create React App
- React Router
- TheMealDB public API
- Express server for the AI proxy
- Google Gemini Flash API (optional)
- CSS Modules and CSS custom properties
- `@hello-pangea/dnd` for meal-plan drag and drop
- `react-hot-toast` for notifications

## Project structure

```text
server.js                 Express entry point for the optional AI backend
server/                   Server-side AI handler and validation
src/
├── components/           Recipe cards, search, filters, navigation, AI chat
├── context/              Favourites, meal-plan, and theme providers
├── hooks/                Persistent state and recipe-search hooks
├── pages/                Home, recipe detail, favourites, planner, shopping list
├── services/             TheMealDB and AI request helpers
├── utils/                Recommendation and shared recipe utilities
├── constants/            Routes, API configuration, and shared settings
└── setupProxy.js         Development proxy for `/api/claude/messages`
```

## Environment variables

Create a `.env` file in the project root. Never commit it or expose server secrets through a `REACT_APP_` variable.

```env
# Required only for AI features; keep this server-side.
GEMINI_API_KEY=your_gemini_api_key_here

# Optional; defaults to 3001 for `npm run server`.
API_PORT=3001
```

TheMealDB requests use its public API and do not require an application key.

## Installation

```bash
git clone <your-repository-url>
cd recipe-finder
npm install
```

Add the optional `.env` values above if you want AI features.

## Run the frontend

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000). In development, Create React App uses `src/setupProxy.js` for the AI route.

## Run the backend

To run the Express server directly:

```bash
npm run server
```

The server listens on `http://127.0.0.1:3001` by default and exposes `/api/health` plus the existing `/api/claude/messages` compatibility endpoint. The endpoint is backed by Gemini; the legacy path is retained so the current frontend does not need a UI or API-contract change.

## Tests and build

```bash
npm test -- --watchAll=false
npm run build
```

## API and provider notes

- TheMealDB supplies recipe search, category, area, ingredient, and detail data.
- Gemini is called only through the server-side Express handler. The API key is never sent to React, logged, or returned in responses.
- AI features require a valid `GEMINI_API_KEY` and remain subject to provider availability, quotas, and network access.
- Recommendation scoring is a small explainable heuristic; it is not a machine-learning model.

## Known limitations

- TheMealDB’s public data varies in completeness and availability.
- TheMealDB’s free API does not provide reliable nutrition or cooking-time data, so the app does not invent those values or provide diet filtering.
- Favourites, meal plans, and shopping lists are stored in the current browser only; they are not synchronized between devices.
- AI features show a friendly unavailable state when the key, quota, provider, or network is unavailable.

## Future improvements

- Add optional account-based synchronization for favourites, meal plans, and shopping lists.
- Expand preference controls and recommendation evaluation with user feedback.
- Add a dedicated nutrition/data-enrichment provider if verified nutrition data is required.
- Add CI checks, production observability, and broader end-to-end coverage.
