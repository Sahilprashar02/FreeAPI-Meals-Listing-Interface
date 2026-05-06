/**
 * filter.js — Pure filtering functions
 *
 * All functions are side-effect-free and operate on plain arrays.
 * null/undefined inputs are treated as empty strings (return all meals).
 */

/**
 * Filter meals by name (case-insensitive substring match).
 *
 * @param {import('./api.js').Meal[]} meals - Array of meal objects
 * @param {string|null|undefined} query    - Search string
 * @returns {import('./api.js').Meal[]}
 */
export function filterByName(meals, query) {
  if (!query) return meals;
  const lower = query.toLowerCase();
  return meals.filter((meal) => meal.name.toLowerCase().includes(lower));
}

/**
 * Filter meals by category (exact match).
 *
 * @param {import('./api.js').Meal[]} meals    - Array of meal objects
 * @param {string|null|undefined} category    - Category value; empty = All
 * @returns {import('./api.js').Meal[]}
 */
export function filterByCategory(meals, category) {
  if (!category) return meals;
  return meals.filter((meal) => meal.category === category);
}
