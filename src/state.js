/**
 * state.js — Application state management
 *
 * Holds the full meals dataset and current filter values.
 * Exposes getters, setters, and a derived filtered view.
 */

import { filterByName, filterByCategory } from './filter.js';

/** @type {import('./api.js').Meal[]} */
let allMeals = [];

/** @type {string} */
let searchQuery = '';

/** @type {string} */
let activeCategory = '';

/**
 * Replace the full meals dataset (called once after fetch).
 * @param {import('./api.js').Meal[]} meals
 */
export function setMeals(meals) {
  allMeals = Array.isArray(meals) ? meals : [];
}

/**
 * Update the current search query.
 * @param {string} q
 */
export function setSearchQuery(q) {
  searchQuery = q ?? '';
}

/**
 * Update the active category filter.
 * @param {string} cat
 */
export function setActiveCategory(cat) {
  activeCategory = cat ?? '';
}

/**
 * Return the meals that satisfy both the current search query
 * and the active category filter.
 * @returns {import('./api.js').Meal[]}
 */
export function getFilteredMeals() {
  const byName = filterByName(allMeals, searchQuery);
  return filterByCategory(byName, activeCategory);
}

/**
 * Read-only snapshot of the current state (useful for testing).
 */
export function getState() {
  return { allMeals, searchQuery, activeCategory };
}
