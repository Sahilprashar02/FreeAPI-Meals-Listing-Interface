// Feature: meals-listing-interface, Property 2
// Feature: meals-listing-interface, Property 3
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { filterByName, filterByCategory } from './filter.js';

/**
 * Arbitrary for a single meal object with at minimum { name, category }.
 */
const mealArb = fc.record({
  name: fc.string({ minLength: 0, maxLength: 40 }),
  category: fc.string({ minLength: 0, maxLength: 20 }),
});

const mealArrayArb = fc.array(mealArb, { minLength: 0, maxLength: 30 });

/**
 * Property 2: Search filter correctness (inclusive and identity-on-empty)
 *
 * Validates: Requirements 4.2, 4.3
 */
describe('Property 2 – filterByName correctness', () => {
  it('every result contains the query string (case-insensitive)', () => {
    fc.assert(
      fc.property(mealArrayArb, fc.string({ minLength: 1, maxLength: 20 }), (meals, query) => {
        const results = filterByName(meals, query);
        const lower = query.toLowerCase();
        for (const meal of results) {
          expect(meal.name.toLowerCase()).toContain(lower);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('no meal whose name contains the query is absent from results (case-insensitive)', () => {
    fc.assert(
      fc.property(mealArrayArb, fc.string({ minLength: 1, maxLength: 20 }), (meals, query) => {
        const results = filterByName(meals, query);
        const lower = query.toLowerCase();
        const resultNames = new Set(results.map((m) => m.name));
        for (const meal of meals) {
          if (meal.name.toLowerCase().includes(lower)) {
            expect(resultNames.has(meal.name)).toBe(true);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('empty query returns all meals unchanged', () => {
    fc.assert(
      fc.property(mealArrayArb, (meals) => {
        const results = filterByName(meals, '');
        expect(results).toEqual(meals);
      }),
      { numRuns: 100 }
    );
  });

  it('null/undefined query returns all meals unchanged', () => {
    fc.assert(
      fc.property(mealArrayArb, (meals) => {
        expect(filterByName(meals, null)).toEqual(meals);
        expect(filterByName(meals, undefined)).toEqual(meals);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 3: Category filter correctness (exact-match and identity-on-all)
 *
 * Validates: Requirements 5.2, 5.3
 */
describe('Property 3 – filterByCategory correctness', () => {
  it('every result exactly matches the selected category', () => {
    // Feature: meals-listing-interface, Property 3
    fc.assert(
      fc.property(mealArrayArb, fc.string({ minLength: 1, maxLength: 20 }), (meals, category) => {
        const results = filterByCategory(meals, category);
        for (const meal of results) {
          expect(meal.category).toBe(category);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('no meal with the selected category is absent from results', () => {
    // Feature: meals-listing-interface, Property 3
    fc.assert(
      fc.property(mealArrayArb, fc.string({ minLength: 1, maxLength: 20 }), (meals, category) => {
        const results = filterByCategory(meals, category);
        const resultSet = new Set(results.map((m) => m.name));
        for (const meal of meals) {
          if (meal.category === category) {
            expect(resultSet.has(meal.name)).toBe(true);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('empty category returns all meals unchanged', () => {
    // Feature: meals-listing-interface, Property 3
    fc.assert(
      fc.property(mealArrayArb, (meals) => {
        const results = filterByCategory(meals, '');
        expect(results).toEqual(meals);
      }),
      { numRuns: 100 }
    );
  });

  it('null/undefined category returns all meals unchanged', () => {
    // Feature: meals-listing-interface, Property 3
    fc.assert(
      fc.property(mealArrayArb, (meals) => {
        expect(filterByCategory(meals, null)).toEqual(meals);
        expect(filterByCategory(meals, undefined)).toEqual(meals);
      }),
      { numRuns: 100 }
    );
  });
});
