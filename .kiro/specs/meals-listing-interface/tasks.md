# Implementation Plan: Meals Listing Interface

## Overview

Build a zero-dependency static web app (HTML + CSS + vanilla ES modules) that fetches meals from the FreeAPI endpoint, normalises the data, and presents it in a searchable, filterable, accessible grid with a detail modal. All filtering is client-side after a single fetch on load.

## Tasks

- [x] 1. Set up project structure and static shell
  - Create `index.html` with semantic landmarks: `<header>`, controls bar (`<input type="search">` + `<select>`), `<main>` grid container, modal `<dialog>`, loading `<div role="status">`, and error `<div role="alert">`
  - Add `<script type="module" src="src/main.js">` and link Tailwind CSS via CDN (or a plain CSS file)
  - Create empty module stubs: `src/api.js`, `src/state.js`, `src/filter.js`, `src/render.js`, `src/main.js`
  - Add `assets/placeholder.svg` for broken-image fallback
  - Set up a testing framework (e.g., Vitest) with a `package.json` and `vitest.config.js`; confirm `npm test` runs
  - _Requirements: 1.1, 2.3, 6.1_

- [x] 2. Implement data fetching and normalisation (`api.js`)
  - [x] 2.1 Implement `fetchMeals()` in `api.js`
    - Send `GET https://api.freeapi.app/api/v1/public/meals`
    - Handle both `data.meals` and `data` array shapes from the API envelope
    - Throw a descriptive error on non-200 HTTP status or network failure
    - Normalise each raw meal object into the internal `Meal` typedef: map `idMeal→id`, `strMeal→name`, `strCategory→category`, `strArea→area`, `strMealThumb→thumbnail`, `strInstructions→instructions`, and build the `ingredients` array by iterating `strIngredient1`–`strIngredient20`, keeping only pairs where the ingredient string is non-empty
    - _Requirements: 1.1, 1.2, 3.2, 3.3_

  - [x] 2.2 Write property test for meal normalisation (Property 8)
    - **Property 8: Meal normalisation preserves all identity fields and ingredient pairs**
    - Generate random raw API meal objects with fast-check; assert that all identity fields map correctly and the `ingredients` array contains exactly the non-empty pairs in order
    - Tag: `// Feature: meals-listing-interface, Property 8`
    - **Validates: Requirements 1.2, 2.1, 3.2, 3.3**

  - [x] 2.3 Write unit tests for `fetchMeals()` normalisation
    - Test: 20 filled ingredient slots, mixed empty/filled slots, all empty slots
    - Test: `data.meals` envelope shape vs. `data` array shape
    - Test: non-200 status throws; network rejection throws
    - _Requirements: 1.1, 1.2, 3.3_

- [x] 3. Implement app state (`state.js`)
  - Initialise `state` object with `allMeals: []`, `searchQuery: ''`, `activeCategory: ''`
  - Implement `getFilteredMeals()` that applies `filterByName` then `filterByCategory` in sequence
  - Export setters: `setMeals(meals)`, `setSearchQuery(q)`, `setActiveCategory(cat)`
  - _Requirements: 4.2, 4.3, 5.2, 5.3, 5.4_

- [~] 4. Implement filtering logic (`filter.js`)
  - [x] 4.1 Implement `filterByName(meals, query)`
    - Return all meals when `query` is empty/null/undefined
    - Return meals whose `name` contains `query` case-insensitively for non-empty queries
    - _Requirements: 4.2, 4.3_

  - [x] 4.2 Write property test for search filter correctness (Property 2)
    - **Property 2: Search filter correctness (inclusive and identity-on-empty)**
    - Generate random meal arrays and query strings; assert every result contains the query (case-insensitive), no matching meal is absent, and empty query returns all meals
    - Tag: `// Feature: meals-listing-interface, Property 2`
    - **Validates: Requirements 4.2, 4.3**

  - [x] 4.3 Implement `filterByCategory(meals, category)`
    - Return all meals when `category` is empty/null/undefined
    - Return meals whose `category` exactly matches the selected value for non-empty category
    - _Requirements: 5.2, 5.3_

  - [-] 4.4 Write property test for category filter correctness (Property 3)
    - **Property 3: Category filter correctness (exact-match and identity-on-all)**
    - Generate random meal arrays and category values; assert all results match the category, no matching meal is absent, and empty category returns all meals
    - Tag: `// Feature: meals-listing-interface, Property 3`
    - **Validates: Requirements 5.2, 5.3**

  - [~] 4.5 Write property test for combined filter equals intersection (Property 4)
    - **Property 4: Combined filter equals intersection of individual filters**
    - Generate random meal arrays, queries, and categories; assert `getFilteredMeals()` result equals the intersection of `filterByName` and `filterByCategory` applied individually
    - Tag: `// Feature: meals-listing-interface, Property 4`
    - **Validates: Requirements 5.4**

  - [~] 4.6 Write unit tests for filter edge cases
    - `filterByName`: exact match, partial match, case variations, no-match query
    - `filterByCategory`: matching category, non-matching category, empty category
    - Combined: search + category, search only, category only, neither
    - _Requirements: 4.2, 4.3, 5.2, 5.3, 5.4_

- [~] 5. Checkpoint — Ensure all tests pass
  - Run the full test suite; confirm all unit and property tests pass. Ask the user if any questions arise before continuing.

- [~] 6. Implement DOM rendering (`render.js`)
  - [~] 6.1 Implement `renderLoading()` and `renderError(msg)`
    - `renderLoading()`: show the `<div role="status">` spinner, hide grid and error
    - `renderError(msg)`: show the `<div role="alert">` with the message and a Retry `<button>`, hide grid and loading indicator
    - _Requirements: 1.3, 1.4, 7.1_

  - [~] 6.2 Implement `renderGrid(meals)`
    - Clear the grid container and insert one `<article>` card per meal
    - Each card: `<img>` with `alt="[meal name]"` and `onerror` fallback to `placeholder.svg`, `<h2>` meal name, category badge `<p>`, area `<p>`
    - Apply `aspect-ratio: 4/3` to images; use a responsive CSS grid (1 col < 768px, multi-col ≥ 768px)
    - Make each card keyboard-focusable (`tabindex="0"`) and handle `click` + `keydown` (Enter/Space) to open the modal
    - When `meals` is empty, display a "No meals found" message in the grid area
    - _Requirements: 1.2, 1.5, 2.1, 2.2, 2.3, 2.4, 4.4, 6.3, 6.5_

  - [~] 6.3 Write property test for meal card rendering (Property 1)
    - **Property 1: Meal card renders all required fields**
    - Generate random meal arrays; assert card count equals meal count and each card contains name, img element, category, and area
    - Tag: `// Feature: meals-listing-interface, Property 1`
    - **Validates: Requirements 1.2, 1.5, 2.1**

  - [~] 6.4 Implement `renderModal(meal)`
    - Use the native `<dialog>` element; call `dialog.showModal()` to open
    - Render: full-size thumbnail (`<img alt="[meal name]">`), `<h2>` meal name, category, area, ingredients table (ingredient | measurement), scrollable instructions block
    - Omit fields gracefully when data is missing — never throw
    - Close button (×): calls `dialog.close()` and returns focus to the triggering card
    - Trap focus inside the dialog while open; close on Escape key (native `<dialog>` behaviour)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 6.4_

  - [~] 6.5 Write property test for modal rendering (Property 6)
    - **Property 6: Meal detail view renders all required fields including ingredients**
    - Generate random meal objects; assert modal contains name, img, category, area, instructions, and all non-empty ingredient/measure pairs
    - Tag: `// Feature: meals-listing-interface, Property 6`
    - **Validates: Requirements 3.2, 3.3**

  - [~] 6.6 Write property test for thumbnail alt text (Property 7)
    - **Property 7: Thumbnail alt text contains meal name**
    - Generate random meal objects; assert `img.alt` contains the meal name in both the card and the modal
    - Tag: `// Feature: meals-listing-interface, Property 7`
    - **Validates: Requirements 6.3**

- [~] 7. Implement category dropdown population
  - [~] 7.1 Add `populateCategoryDropdown(meals)` in `render.js`
    - Derive the sorted set of unique `category` values from the meals array
    - Prepend `<option value="">All Categories</option>` then one `<option>` per unique category
    - _Requirements: 5.1_

  - [~] 7.2 Write property test for category dropdown options (Property 5)
    - **Property 5: Category dropdown options match unique categories in data**
    - Generate random meal arrays; assert dropdown options (excluding "All") equal the set of unique categories in the data — no more, no fewer
    - Tag: `// Feature: meals-listing-interface, Property 5`
    - **Validates: Requirements 5.1**

- [~] 8. Wire everything together (`main.js`)
  - Implement `loadMeals()`: call `renderLoading()`, then `fetchMeals()`, then `state.setMeals()`, then `populateCategoryDropdown()`, then `renderGrid(state.getFilteredMeals())`; on error call `renderError()`
  - Implement `applyFilters()`: read current search and category values, update state, call `renderGrid(state.getFilteredMeals())`
  - Attach debounced (150ms) `input` listener on the search `<input>` to call `applyFilters()`
  - Attach `change` listener on the category `<select>` to call `applyFilters()`
  - Attach `click` listener on the Retry button (via event delegation on the error container) to re-run `loadMeals()`
  - Call `loadMeals()` on `DOMContentLoaded`
  - _Requirements: 1.1, 1.3, 1.4, 3.4, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4, 7.1, 7.2, 7.3_

- [~] 9. Accessibility and responsive polish
  - Add `aria-label="Search meals by name"` to the search input and `aria-label="Filter by category"` to the select
  - Verify color contrast meets 4.5:1 minimum for all text/background pairs; adjust CSS variables if needed
  - Confirm keyboard flow: Tab through cards → Enter/Space opens modal → Escape closes modal → focus returns to triggering card
  - Confirm no horizontal scrollbar at 320px, 768px, 1280px, and 1920px viewport widths
  - Confirm single-column layout below 768px
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [~] 10. Final checkpoint — Ensure all tests pass
  - Run the full test suite; confirm all unit and property tests pass. Ask the user if any questions arise before proceeding to deployment.

## Notes

- Sub-tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check with a minimum of 100 iterations per property
- Unit tests complement property tests by covering specific examples and edge cases
- Checkpoints at tasks 5 and 10 ensure incremental validation before moving forward
