/**
 * Smoke tests for filter.js — verifies the test framework is wired up correctly.
 * Full property and unit tests are added in later tasks.
 */

import { describe, it, expect } from 'vitest';
import { filterByName, filterByCategory } from './filter.js';

describe('filterByName', () => {
  it('returns all meals when query is empty', () => {
    const meals = [{ name: 'Pasta' }, { name: 'Pizza' }];
    expect(filterByName(meals, '')).toEqual(meals);
  });

  it('returns all meals when query is null', () => {
    const meals = [{ name: 'Pasta' }];
    expect(filterByName(meals, null)).toEqual(meals);
  });

  it('filters case-insensitively', () => {
    const meals = [{ name: 'Chicken Tikka' }, { name: 'Beef Stew' }];
    expect(filterByName(meals, 'chicken')).toEqual([{ name: 'Chicken Tikka' }]);
  });

  it('returns empty array when no meals match', () => {
    const meals = [{ name: 'Pasta' }];
    expect(filterByName(meals, 'xyz')).toEqual([]);
  });
});

describe('filterByCategory', () => {
  it('returns all meals when category is empty', () => {
    const meals = [{ name: 'Pasta', category: 'Italian' }];
    expect(filterByCategory(meals, '')).toEqual(meals);
  });

  it('returns all meals when category is null', () => {
    const meals = [{ name: 'Pasta', category: 'Italian' }];
    expect(filterByCategory(meals, null)).toEqual(meals);
  });

  it('filters by exact category match', () => {
    const meals = [
      { name: 'Pasta', category: 'Italian' },
      { name: 'Sushi', category: 'Japanese' },
    ];
    expect(filterByCategory(meals, 'Italian')).toEqual([{ name: 'Pasta', category: 'Italian' }]);
  });
});
