/**
 * main.js — Application entry point
 *
 * Wires event listeners and orchestrates the load sequence.
 */

import { fetchMeals } from './api.js';
import { setMeals, setSearchQuery, setActiveCategory, getFilteredMeals } from './state.js';
import { renderLoading, renderError, renderGrid, renderModal, populateCategoryDropdown } from './render.js';

// ─── Load sequence ─────────────────────────────────────────────────────────

/**
 * Fetch meals and render the grid. Shows loading/error states as needed.
 */
async function loadMeals() {
  renderLoading();
  try {
    const meals = await fetchMeals();
    setMeals(meals);
    populateCategoryDropdown(meals);
    renderGrid(getFilteredMeals());
  } catch (err) {
    renderError(err.message || 'An unexpected error occurred. Please try again.');
  }
}

// ─── Filter application ────────────────────────────────────────────────────

/**
 * Read current control values, update state, and re-render the grid.
 */
function applyFilters() {
  const searchInput = document.getElementById('search-input');
  const categorySelect = document.getElementById('category-select');
  setSearchQuery(searchInput ? searchInput.value : '');
  setActiveCategory(categorySelect ? categorySelect.value : '');
  renderGrid(getFilteredMeals());
}

// ─── Debounce utility ──────────────────────────────────────────────────────

/**
 * Returns a debounced version of fn that fires after `delay` ms of inactivity.
 * @param {Function} fn
 * @param {number} delay
 */
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ─── Event listeners ───────────────────────────────────────────────────────

function init() {
  const searchInput = document.getElementById('search-input');
  const categorySelect = document.getElementById('category-select');
  const errorContainer = document.getElementById('error-container');
  const mealsGrid = document.getElementById('meals-grid');

  // Debounced search
  if (searchInput) {
    searchInput.addEventListener('input', debounce(applyFilters, 150));
  }

  // Category change
  if (categorySelect) {
    categorySelect.addEventListener('change', applyFilters);
  }

  // Retry button (event delegation on error container)
  if (errorContainer) {
    errorContainer.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'retry-button') {
        loadMeals();
      }
    });
  }

  // Card click / keyboard — open modal (event delegation on grid)
  if (mealsGrid) {
    mealsGrid.addEventListener('click', handleCardActivation);
    mealsGrid.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleCardActivation(e);
      }
    });
  }

  // Kick off the initial load
  loadMeals();
}

/**
 * Handle card click or keyboard activation to open the detail modal.
 * @param {Event} e
 */
function handleCardActivation(e) {
  const card = e.target.closest('[data-meal-id]');
  if (!card) return;

  // Import state lazily to get current allMeals
  import('./state.js').then(({ getState }) => {
    const { allMeals } = getState();
    const meal = allMeals.find((m) => m.id === card.dataset.mealId);
    if (meal) {
      renderModal(meal, card);
    }
  });
}

// ─── Bootstrap ─────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', init);
