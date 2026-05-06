// Feature: meals-listing-interface, Property 8
// Property 8: Meal normalisation preserves all identity fields and ingredient pairs
// Validates: Requirements 1.2, 2.1, 3.2, 3.3

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { normaliseMeal } from './api.js';

/**
 * Arbitrary for a single ingredient/measure slot value:
 * can be null, empty string, whitespace-only, or a non-empty string.
 */
const slotArb = fc.oneof(
  fc.constant(null),
  fc.constant(''),
  fc.constant('   '),
  fc.string({ minLength: 1, maxLength: 30 }),
);

/**
 * Arbitrary for a raw API meal object with all 20 ingredient/measure pairs.
 */
const rawMealArb = fc.record({
  idMeal: fc.string({ minLength: 0, maxLength: 20 }),
  strMeal: fc.string({ minLength: 0, maxLength: 80 }),
  strCategory: fc.string({ minLength: 0, maxLength: 40 }),
  strArea: fc.string({ minLength: 0, maxLength: 40 }),
  strMealThumb: fc.string({ minLength: 0, maxLength: 200 }),
  strInstructions: fc.string({ minLength: 0, maxLength: 500 }),
  // Generate all 20 ingredient/measure pairs
  strIngredient1: slotArb, strMeasure1: slotArb,
  strIngredient2: slotArb, strMeasure2: slotArb,
  strIngredient3: slotArb, strMeasure3: slotArb,
  strIngredient4: slotArb, strMeasure4: slotArb,
  strIngredient5: slotArb, strMeasure5: slotArb,
  strIngredient6: slotArb, strMeasure6: slotArb,
  strIngredient7: slotArb, strMeasure7: slotArb,
  strIngredient8: slotArb, strMeasure8: slotArb,
  strIngredient9: slotArb, strMeasure9: slotArb,
  strIngredient10: slotArb, strMeasure10: slotArb,
  strIngredient11: slotArb, strMeasure11: slotArb,
  strIngredient12: slotArb, strMeasure12: slotArb,
  strIngredient13: slotArb, strMeasure13: slotArb,
  strIngredient14: slotArb, strMeasure14: slotArb,
  strIngredient15: slotArb, strMeasure15: slotArb,
  strIngredient16: slotArb, strMeasure16: slotArb,
  strIngredient17: slotArb, strMeasure17: slotArb,
  strIngredient18: slotArb, strMeasure18: slotArb,
  strIngredient19: slotArb, strMeasure19: slotArb,
  strIngredient20: slotArb, strMeasure20: slotArb,
});

describe('Property 8: normaliseMeal preserves all identity fields and ingredient pairs', () => {
  it('maps all identity fields correctly from raw to internal model', () => {
    fc.assert(
      fc.property(rawMealArb, (raw) => {
        const meal = normaliseMeal(raw);

        // Identity field mappings
        expect(meal.id).toBe(raw.idMeal || '');
        expect(meal.name).toBe(raw.strMeal || '');
        expect(meal.category).toBe(raw.strCategory || '');
        expect(meal.area).toBe(raw.strArea || '');
        expect(meal.thumbnail).toBe(raw.strMealThumb || '');
        expect(meal.instructions).toBe(raw.strInstructions || '');
      }),
      { numRuns: 100 }
    );
  });

  it('ingredients array contains exactly the non-empty pairs in order', () => {
    fc.assert(
      fc.property(rawMealArb, (raw) => {
        const meal = normaliseMeal(raw);

        // Build the expected ingredients list: only slots where ingredient is non-empty after trim
        const expected = [];
        for (let i = 1; i <= 20; i++) {
          const ingredient = (raw[`strIngredient${i}`] || '').trim();
          const measure = (raw[`strMeasure${i}`] || '').trim();
          if (ingredient) {
            expected.push({ ingredient, measure });
          }
        }

        // The ingredients array must have the same length as expected
        expect(meal.ingredients).toHaveLength(expected.length);

        // Each pair must match in order
        for (let j = 0; j < expected.length; j++) {
          expect(meal.ingredients[j].ingredient).toBe(expected[j].ingredient);
          expect(meal.ingredients[j].measure).toBe(expected[j].measure);
        }
      }),
      { numRuns: 100 }
    );
  });
});
