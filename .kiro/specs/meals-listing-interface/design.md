# Design Document: Meals Listing Interface

## Overview

The Meals Listing Interface is a pure static web application (HTML + CSS + JavaScript, no build tools) that fetches meal/recipe data from the FreeAPI meals endpoint and presents it in a browsable, searchable, filterable grid. The app is deployable to GitHub Pages or any static host.

**Key design goals:**
- Zero dependencies beyond optional Tailwind CSS via CDN
- All state managed in memory after a single API fetch on load
- Client-side filtering (search + category) with no additional network requests
- Accessible, responsive layout from 320px to 1920px

**API endpoint:** `GET https://api.freeapi.app/api/v1/public/meals`

The endpoint returns a JSON envelope wrapping a `data` array of meal objects sourced from TheMealDB. Each meal object contains fields like `idMeal`, `strMeal`, `strCategory`, `strArea`, `strMealThumb`, `strInstructions`, and up to 20 ingredient/measure pairs (`strIngredient1`–`strIngredient20`, `strMeasure1`–`strMeasure20`).

---

## Architecture

The application follows a simple **data → state → render** pipeline with no framework:

```
┌─────────────────────────────────────────────────────────────┐
│                        index.html                           │
│  ┌──────────┐   ┌──────────────┐   ┌─────────────────────┐ │
│  │  api.js  │──▶│   state.js   │──▶│     render.js       │ │
│  │ (fetch)  │   │ (app state)  │   │ (DOM manipulation)  │ │
│  └──────────┘   └──────────────┘   └─────────────────────┘ │
│                        │                                    │
│                  ┌─────▼──────┐                             │
│                  │  filter.js │                             │
│                  │ (search +  │                             │
│                  │  category) │                             │
│                  └────────────┘                             │
└─────────────────────────────────────────────────────────────┘
```

**Module responsibilities:**

| Module | Responsibility |
|---|---|
| `api.js` | `fetchMeals()` — single `fetch()` call, returns parsed meal array or throws |
| `state.js` | Holds `allMeals`, `searchQuery`, `activeCategory`; exposes `getFilteredMeals()` |
| `filter.js` | Pure functions: `filterByName(meals, query)`, `filterByCategory(meals, category)` |
| `render.js` | `renderGrid(meals)`, `renderModal(meal)`, `renderLoading()`, `renderError(msg)` |
| `main.js` | Entry point — wires event listeners, orchestrates load sequence |

All modules are plain ES modules loaded via `<script type="module">` — no bundler needed.

---

## Components and Interfaces

### 1. App Shell (`index.html`)

```
┌──────────────────────────────────────────────────────┐
│  Header: App title                                   │
├──────────────────────────────────────────────────────┤
│  Controls bar:  [Search input]  [Category dropdown]  │
├──────────────────────────────────────────────────────┤
│  Main content area                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│  │ MealCard │ │ MealCard │ │ MealCard │  ...         │
│  └──────────┘ └──────────┘ └──────────┘             │
├──────────────────────────────────────────────────────┤
│  [Modal overlay — hidden by default]                 │
└──────────────────────────────────────────────────────┘
```

### 2. Meal Card

Each card is a `<article>` element containing:
- `<img>` — thumbnail, `alt="[meal name]"`, fixed aspect ratio via `aspect-ratio: 4/3`
- `<h2>` — meal name
- `<p>` — category badge
- `<p>` — cuisine area

Cards are keyboard-focusable (`tabindex="0"`) and respond to both `click` and `keydown` (Enter/Space) to open the detail view.

### 3. Meal Detail Modal

A `<dialog>` element (native HTML dialog for accessibility):
- Backdrop overlay
- Full-size thumbnail
- Meal name (`<h2>`)
- Category and area metadata
- Ingredients table: ingredient name | measurement
- Scrollable instructions block
- Close button (×) — keyboard accessible, returns focus to the triggering card

### 4. Search Bar

- `<input type="search">` with `aria-label="Search meals by name"`
- `input` event listener triggers `applyFilters()` on every keystroke (live filtering)
- Debounced at 150ms to avoid excessive DOM updates on fast typing

### 5. Category Filter

- `<select>` with `aria-label="Filter by category"`
- Populated dynamically from unique `strCategory` values in the fetched data
- First option: `<option value="">All Categories</option>`
- `change` event triggers `applyFilters()`

### 6. Loading Indicator

- `<div role="status" aria-live="polite">` containing a CSS spinner
- Shown immediately (within 100ms) when fetch begins; hidden when data arrives or error occurs

### 7. Error Message

- `<div role="alert">` with descriptive text and a "Retry" `<button>`
- Retry button re-invokes the full load sequence

---

## Data Models

### Raw API Response

```javascript
// GET https://api.freeapi.app/api/v1/public/meals
{
  "statusCode": 200,
  "data": {
    "meals": [
      {
        "idMeal": "52772",
        "strMeal": "Teriyaki Chicken Casserole",
        "strCategory": "Chicken",
        "strArea": "Japanese",
        "strInstructions": "...",
        "strMealThumb": "https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg",
        "strIngredient1": "soy sauce",
        "strMeasure1": "3/4 cup",
        // ... up to strIngredient20 / strMeasure20
        // null or empty string for unused slots
      }
    ]
  }
}
```

> Note: The FreeAPI wrapper may return the meals array directly under `data` or under `data.meals` depending on the endpoint version. The `api.js` module normalises this.

### Internal Meal Object

After normalisation, the app works with a clean internal model:

```javascript
/**
 * @typedef {Object} Meal
 * @property {string} id           - idMeal
 * @property {string} name         - strMeal
 * @property {string} category     - strCategory
 * @property {string} area         - strArea
 * @property {string} thumbnail    - strMealThumb URL
 * @property {string} instructions - strInstructions
 * @property {Array<{ingredient: string, measure: string}>} ingredients
 */
```

The `ingredients` array is built by iterating `strIngredient1`–`strIngredient20` and filtering out entries where both ingredient and measure are empty/null.

### App State

```javascript
const state = {
  allMeals: [],        // Meal[] — full dataset, set once on load
  searchQuery: '',     // string — current search bar value
  activeCategory: '',  // string — selected category, '' = All
};
```

`getFilteredMeals()` applies both filters in sequence:
1. `filterByName(state.allMeals, state.searchQuery)`
2. `filterByCategory(result, state.activeCategory)`

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Meal card renders all required fields

*For any* collection of meals, every rendered Meal_Card must contain the meal's name, a thumbnail image element, category, and cuisine area — and the number of rendered cards must equal the number of meals in the input collection.

**Validates: Requirements 1.2, 1.5, 2.1**

### Property 2: Search filter correctness (inclusive and identity-on-empty)

*For any* collection of meals and any search query string: (a) every meal returned by `filterByName` must have a name that contains the query string case-insensitively, and no meal whose name contains the query string is excluded; (b) when the query is an empty string, `filterByName` returns all meals unchanged.

**Validates: Requirements 4.2, 4.3**

### Property 3: Category filter correctness (exact-match and identity-on-all)

*For any* collection of meals and any category value: (a) when a non-empty category is selected, every meal returned by `filterByCategory` must have a category that exactly matches the selected value, and no meal with that category is excluded; (b) when the category is the empty string (representing "All"), `filterByCategory` returns all meals unchanged.

**Validates: Requirements 5.2, 5.3**

### Property 4: Combined filter equals intersection of individual filters

*For any* collection of meals, search query, and category, the result of applying both filters together must contain exactly the meals that satisfy both the name filter and the category filter individually. Formally: `combined = byName ∩ byCategory`.

**Validates: Requirements 5.4**

### Property 5: Category dropdown options match unique categories in data

*For any* collection of meals, the options rendered in the Category_Filter (excluding the "All" option) must be exactly the set of unique `category` values present in the meal collection — no more, no fewer.

**Validates: Requirements 5.1**

### Property 6: Meal detail view renders all required fields including ingredients

*For any* meal object, the rendered Meal_Detail_View must contain the meal name, a full-size thumbnail image, category, cuisine area, cooking instructions, and a list of ingredient/measurement pairs containing exactly the non-empty ingredient entries from the meal's ingredient slots.

**Validates: Requirements 3.2, 3.3**

### Property 7: Thumbnail alt text contains meal name

*For any* meal, the `alt` attribute of the thumbnail `<img>` element in both the Meal_Card and Meal_Detail_View must contain the meal's name.

**Validates: Requirements 6.3**

### Property 8: Meal normalisation preserves all identity fields and ingredient pairs

*For any* raw API meal object, the normalised internal `Meal` object must: (a) have `id`, `name`, `category`, `area`, `thumbnail`, and `instructions` equal to the corresponding raw fields; and (b) have an `ingredients` array containing exactly the ingredient/measure pairs where the raw ingredient string is non-empty, in the same order.

**Validates: Requirements 1.2, 2.1, 3.2, 3.3**

---

## Error Handling

| Scenario | Handling |
|---|---|
| Network failure (`fetch` rejects) | Show Error_Message with "Network error — check your connection" and Retry button |
| Non-200 HTTP status | Show Error_Message with status code and Retry button |
| Empty `meals` array in response | Show "No meals available" message (not an error state) |
| Thumbnail image load failure | `onerror` handler swaps `src` to a local placeholder SVG (`/assets/placeholder.svg`) |
| Modal opened with missing data | Gracefully omit missing fields; never throw |
| `filterByName` / `filterByCategory` called with null/undefined | Treat as empty string — return all meals |

**Retry logic:** The Retry button re-runs the full `loadMeals()` sequence (show loading → fetch → render or error). No exponential back-off is needed for this scope.

---

## Testing Strategy

### Unit Tests (example-based)

Focused on the pure logic modules (`filter.js`, `api.js` normalisation):

- `filterByName` with exact match, partial match, case variations, empty query, no-match query
- `filterByCategory` with matching category, non-matching category, empty category ("All")
- Combined filter: search + category, search only, category only, neither
- Ingredient normalisation: 20 filled slots, mixed empty/filled slots, all empty slots
- Meal normalisation: verifies all identity fields map correctly

### Property-Based Tests

Using a property-based testing library (e.g., [fast-check](https://github.com/dubzzz/fast-check) for JavaScript):

Each property test runs a minimum of **100 iterations** with randomly generated inputs.

Tag format: `// Feature: meals-listing-interface, Property N: <property text>`

| Property | Generator inputs | Assertion |
|---|---|---|
| P1 — Card renders all fields | Random meal array | Card count equals meal count; each card contains name, img, category, area |
| P2 — Search filter correctness | Random meal array + random query string | All results contain query (case-insensitive); no matching meal absent; empty query returns all |
| P3 — Category filter correctness | Random meal array + random category | All results match category; no matching meal absent; empty category returns all |
| P4 — Combined filter = intersection | Random meal array + random query + random category | Combined result equals intersection of individual filter results |
| P5 — Category options = unique categories | Random meal array | Dropdown options (minus "All") equal unique categories in data |
| P6 — Detail view renders all fields | Random meal object | Modal contains name, img, category, area, instructions, all non-empty ingredient/measure pairs |
| P7 — Alt text contains meal name | Random meal object | `img.alt` contains meal name in both card and modal |
| P8 — Normalisation preserves fields and ingredients | Random raw API meal object | All identity fields match raw fields; ingredients array contains exactly non-empty pairs in order |

### Integration / Smoke Tests

- App loads in a browser and displays meals (manual or Playwright smoke test)
- Loading indicator appears before data arrives
- Error state renders when API is unreachable (mock fetch to reject)
- Modal opens on card click and closes on dismiss without re-fetching

### Accessibility Checks

- Run axe-core or Lighthouse accessibility audit against the rendered page
- Verify keyboard navigation: Tab through cards, Enter/Space opens modal, Escape closes modal
- Verify contrast ratios meet 4.5:1 minimum

### Responsive Layout Checks

- Visual check at 320px, 768px, 1280px, 1920px viewports
- Confirm single-column layout below 768px
- Confirm no horizontal scrollbar at any tested width
