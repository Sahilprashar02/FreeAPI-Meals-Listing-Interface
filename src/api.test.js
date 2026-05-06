/**
 * Unit tests for fetchMeals() and normaliseMeal()
 * Requirements: 1.1, 1.2, 3.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchMeals, normaliseMeal } from './api.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a raw meal object with all 20 ingredient/measure slots filled.
 */
function buildRawMealAllFilled() {
  const raw = {
    idMeal: '52772',
    strMeal: 'Test Meal',
    strCategory: 'Chicken',
    strArea: 'Japanese',
    strMealThumb: 'https://example.com/thumb.jpg',
    strInstructions: 'Cook it.',
  };
  for (let i = 1; i <= 20; i++) {
    raw[`strIngredient${i}`] = `Ingredient ${i}`;
    raw[`strMeasure${i}`] = `${i} tbsp`;
  }
  return raw;
}

/**
 * Build a raw meal object with only the first N ingredient slots filled,
 * the rest empty strings.
 */
function buildRawMealPartialFilled(filledCount) {
  const raw = {
    idMeal: '12345',
    strMeal: 'Partial Meal',
    strCategory: 'Beef',
    strArea: 'British',
    strMealThumb: '',
    strInstructions: '',
  };
  for (let i = 1; i <= 20; i++) {
    raw[`strIngredient${i}`] = i <= filledCount ? `Ingredient ${i}` : '';
    raw[`strMeasure${i}`] = i <= filledCount ? `${i} g` : '';
  }
  return raw;
}

/**
 * Build a raw meal object with all ingredient slots empty.
 */
function buildRawMealAllEmpty() {
  return buildRawMealPartialFilled(0);
}

/**
 * Create a mock Response object for vi.stubGlobal('fetch', ...).
 */
function mockResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(body),
  };
}

// ---------------------------------------------------------------------------
// normaliseMeal — ingredient slot tests
// ---------------------------------------------------------------------------

describe('normaliseMeal — ingredient normalisation', () => {
  it('includes all 20 pairs when all ingredient slots are filled', () => {
    const raw = buildRawMealAllFilled();
    const meal = normaliseMeal(raw);

    expect(meal.ingredients).toHaveLength(20);
    for (let i = 0; i < 20; i++) {
      expect(meal.ingredients[i].ingredient).toBe(`Ingredient ${i + 1}`);
      expect(meal.ingredients[i].measure).toBe(`${i + 1} tbsp`);
    }
  });

  it('includes only non-empty slots when some ingredient slots are empty', () => {
    // Slots 1–5 filled, 6–20 empty
    const raw = buildRawMealPartialFilled(5);
    const meal = normaliseMeal(raw);

    expect(meal.ingredients).toHaveLength(5);
    for (let i = 0; i < 5; i++) {
      expect(meal.ingredients[i].ingredient).toBe(`Ingredient ${i + 1}`);
    }
  });

  it('returns an empty ingredients array when all ingredient slots are empty', () => {
    const raw = buildRawMealAllEmpty();
    const meal = normaliseMeal(raw);

    expect(meal.ingredients).toHaveLength(0);
    expect(meal.ingredients).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// fetchMeals — API envelope shapes
// ---------------------------------------------------------------------------

describe('fetchMeals — API envelope handling', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('handles { data: { meals: [...] } } envelope shape', async () => {
    const rawMeal = buildRawMealPartialFilled(3);
    fetch.mockResolvedValue(
      mockResponse(200, { data: { meals: [rawMeal] } })
    );

    const meals = await fetchMeals();

    expect(meals).toHaveLength(1);
    expect(meals[0].name).toBe(rawMeal.strMeal);
    expect(meals[0].ingredients).toHaveLength(3);
  });

  it('handles { data: [...] } envelope shape', async () => {
    const rawMeal = buildRawMealPartialFilled(2);
    fetch.mockResolvedValue(
      mockResponse(200, { data: [rawMeal] })
    );

    const meals = await fetchMeals();

    expect(meals).toHaveLength(1);
    expect(meals[0].name).toBe(rawMeal.strMeal);
    expect(meals[0].ingredients).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// fetchMeals — error handling
// ---------------------------------------------------------------------------

describe('fetchMeals — error handling', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('throws an error containing the HTTP status when response is non-200', async () => {
    fetch.mockResolvedValue(mockResponse(404, {}));

    await expect(fetchMeals()).rejects.toThrow('404');
  });

  it('throws an error containing the network error message on fetch rejection', async () => {
    const networkError = new Error('Failed to fetch');
    fetch.mockRejectedValue(networkError);

    await expect(fetchMeals()).rejects.toThrow('Failed to fetch');
  });
});
