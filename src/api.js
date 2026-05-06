/**
 * api.js — Data fetching and normalisation
 *
 * Responsible for fetching meals from the FreeAPI endpoint and
 * normalising raw API objects into the internal Meal typedef.
 */

const MEALS_API_URL = 'https://api.freeapi.app/api/v1/public/meals';

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

/**
 * Normalise a raw API meal object into the internal Meal model.
 * @param {Object} raw - Raw meal object from the API
 * @returns {Meal}
 */
export function normaliseMeal(raw) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = (raw[`strIngredient${i}`] || '').trim();
    const measure = (raw[`strMeasure${i}`] || '').trim();
    if (ingredient) {
      ingredients.push({ ingredient, measure });
    }
  }

  return {
    id: raw.idMeal || '',
    name: raw.strMeal || '',
    category: raw.strCategory || '',
    area: raw.strArea || '',
    thumbnail: raw.strMealThumb || '',
    instructions: raw.strInstructions || '',
    ingredients,
  };
}

/**
 * Fetch meals from the FreeAPI endpoint and return a normalised array.
 * Throws a descriptive error on non-200 status or network failure.
 * @returns {Promise<Meal[]>}
 */
export async function fetchMeals() {
  let response;
  try {
    response = await fetch(MEALS_API_URL);
  } catch (err) {
    throw new Error(`Network error — check your connection. (${err.message})`);
  }

  if (!response.ok) {
    throw new Error(`Failed to load meals (HTTP ${response.status} ${response.statusText})`);
  }

  const json = await response.json();

  // Handle various data wrapper shapes from FreeAPI
  const data = json.data;
  let rawMeals = [];
  if (Array.isArray(data)) {
    rawMeals = data;
  } else if (data && Array.isArray(data.meals)) {
    rawMeals = data.meals;
  } else if (data && Array.isArray(data.data)) {
    rawMeals = data.data;
  }

  return rawMeals.map(normaliseMeal);
}
