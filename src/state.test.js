/**
 * state.test.js — Unit tests for state.js
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  setMeals,
  setSearchQuery,
  setActiveCategory,
  getFilteredMeals,
  getState,
} from './state.js';

/** Helper to build a minimal Meal object */
function makeMeal(id, name, category, area = 'Unknown') {
  return { id, name, category, area, thumbnail: '', instructions: '', ingredients: [] };
}

const MEALS = [
  makeMeal('1', 'Chicken Tikka', 'Chicken', 'Indian'),
  makeMeal('2', 'Beef Stew', 'Beef', 'British'),
  makeMeal('3', 'Chicken Soup', 'Chicken', 'American'),
  makeMeal('4', 'Pasta Carbonara', 'Pasta', 'Italian'),
];

// Reset state before every test so module-level variables don't bleed across tests
beforeEach(() => {
  setMeals([]);
  setSearchQuery('');
  setActiveCategory('');
});

describe('initial state', () => {
  it('has empty allMeals', () => {
    const { allMeals } = getState();
    expect(allMeals).toEqual([]);
  });

  it('has empty searchQuery', () => {
    const { searchQuery } = getState();
    expect(searchQuery).toBe('');
  });

  it('has empty activeCategory', () => {
    const { activeCategory } = getState();
    expect(activeCategory).toBe('');
  });
});

describe('setMeals()', () => {
  it('updates allMeals with the provided array', () => {
    setMeals(MEALS);
    const { allMeals } = getState();
    expect(allMeals).toEqual(MEALS);
  });

  it('treats non-array input as empty array', () => {
    setMeals(null);
    expect(getState().allMeals).toEqual([]);
  });
});

describe('setSearchQuery()', () => {
  it('updates searchQuery', () => {
    setSearchQuery('chicken');
    expect(getState().searchQuery).toBe('chicken');
  });

  it('treats null as empty string', () => {
    setSearchQuery(null);
    expect(getState().searchQuery).toBe('');
  });
});

describe('setActiveCategory()', () => {
  it('updates activeCategory', () => {
    setActiveCategory('Beef');
    expect(getState().activeCategory).toBe('Beef');
  });

  it('treats null as empty string', () => {
    setActiveCategory(null);
    expect(getState().activeCategory).toBe('');
  });
});

describe('getFilteredMeals()', () => {
  beforeEach(() => {
    setMeals(MEALS);
  });

  it('returns all meals when no filters are set', () => {
    expect(getFilteredMeals()).toEqual(MEALS);
  });

  it('applies search filter by name (case-insensitive)', () => {
    setSearchQuery('chicken');
    const result = getFilteredMeals();
    expect(result).toHaveLength(2);
    expect(result.map((m) => m.name)).toEqual(['Chicken Tikka', 'Chicken Soup']);
  });

  it('applies category filter', () => {
    setActiveCategory('Beef');
    const result = getFilteredMeals();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Beef Stew');
  });

  it('applies both search and category filters together', () => {
    setSearchQuery('chicken');
    setActiveCategory('Chicken');
    const result = getFilteredMeals();
    // Both "Chicken Tikka" and "Chicken Soup" are in category Chicken and match "chicken"
    expect(result).toHaveLength(2);
    expect(result.every((m) => m.category === 'Chicken')).toBe(true);
  });

  it('returns empty array when search matches nothing', () => {
    setSearchQuery('zzznomatch');
    expect(getFilteredMeals()).toEqual([]);
  });

  it('returns empty array when category matches nothing', () => {
    setActiveCategory('Seafood');
    expect(getFilteredMeals()).toEqual([]);
  });

  it('returns empty array when both filters together match nothing', () => {
    setSearchQuery('chicken');
    setActiveCategory('Beef');
    expect(getFilteredMeals()).toEqual([]);
  });
});
