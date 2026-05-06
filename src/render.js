/**
 * render.js — DOM rendering functions
 *
 * All functions manipulate the DOM directly.
 * No framework — plain ES module.
 */

const PLACEHOLDER_SRC = '/assets/placeholder.svg';

// ─── Element references ────────────────────────────────────────────────────

function getEl(id) {
  return document.getElementById(id);
}

// ─── Loading / Error states ────────────────────────────────────────────────

/**
 * Show the loading spinner; hide grid and error.
 */
export function renderLoading() {
  getEl('loading-indicator').classList.remove('hidden');
  getEl('error-container').classList.add('hidden');
  getEl('meals-grid').classList.add('hidden');
}

/**
 * Show the error message with a retry button; hide grid and loading.
 * @param {string} msg - Human-readable error description
 */
export function renderError(msg) {
  getEl('loading-indicator').classList.add('hidden');
  getEl('meals-grid').classList.add('hidden');
  getEl('error-message').textContent = msg;
  getEl('error-container').classList.remove('hidden');
}

// ─── Grid rendering ────────────────────────────────────────────────────────

/**
 * Render the meals grid.
 * @param {import('./api.js').Meal[]} meals
 */
export function renderGrid(meals) {
  getEl('loading-indicator').classList.add('hidden');
  getEl('error-container').classList.add('hidden');

  const grid = getEl('meals-grid');
  grid.classList.remove('hidden');
  grid.innerHTML = '';

  if (!meals || meals.length === 0) {
    grid.innerHTML = `
      <p style="grid-column: 1 / -1; text-align: center; padding: 4rem 0; color: var(--text-secondary);">
        No meals found. Try searching for something else.
      </p>`;
    return;
  }

  meals.forEach((meal) => {
    const article = createMealCard(meal);
    grid.appendChild(article);
  });
}

/**
 * Build a single meal card element.
 * @param {import('./api.js').Meal} meal
 * @returns {HTMLElement}
 */
function createMealCard(meal) {
  const article = document.createElement('article');
  article.className = 'meal-card';
  article.tabIndex = 0;
  article.dataset.mealId = meal.id;

  article.innerHTML = `
    <div class="img-container">
      <img
        src="${escapeAttr(meal.thumbnail)}"
        alt="${escapeAttr(meal.name)}"
        loading="lazy"
      />
    </div>
    <div class="meal-card-content">
      <h2 class="meal-title">${escapeHtml(meal.name)}</h2>
      <div class="meal-tags">
        <span class="tag tag-accent">${escapeHtml(meal.category)}</span>
        <span class="tag">${escapeHtml(meal.area)}</span>
      </div>
    </div>
  `;

  // Broken image fallback
  const img = article.querySelector('img');
  img.addEventListener('error', () => {
    img.src = PLACEHOLDER_SRC;
  });

  return article;
}

// ─── Modal rendering ───────────────────────────────────────────────────────

/**
 * Open the detail modal for a meal.
 * @param {import('./api.js').Meal} meal
 * @param {HTMLElement|null} triggerEl - Element to return focus to on close
 */
export function renderModal(meal, triggerEl = null) {
  const dialog = getEl('meal-modal');
  const content = getEl('modal-content');

  const ingredientRows = (meal.ingredients || [])
    .map(
      ({ ingredient, measure }) => `
      <tr>
        <td>${escapeHtml(ingredient)}</td>
        <td>${escapeHtml(measure)}</td>
      </tr>`
    )
    .join('');

  content.innerHTML = `
    <img
      src="${escapeAttr(meal.thumbnail)}"
      alt="${escapeAttr(meal.name)}"
      class="modal-img"
    />
    <h2 id="modal-meal-name" class="modal-title">${escapeHtml(meal.name)}</h2>
    <div class="modal-meta">
      <span class="tag tag-accent">${escapeHtml(meal.category)}</span>
      <span class="tag">${escapeHtml(meal.area)}</span>
    </div>
    ${
      ingredientRows
        ? `<h3 class="modal-section-title">Ingredients</h3>
           <table class="modal-table">
             <thead>
               <tr>
                 <th>Ingredient</th>
                 <th>Measure</th>
               </tr>
             </thead>
             <tbody>${ingredientRows}</tbody>
           </table>`
        : ''
    }
    ${
      meal.instructions
        ? `<h3 class="modal-section-title">Instructions</h3>
           <div class="modal-instructions">
             ${escapeHtml(meal.instructions)}
           </div>`
        : ''
    }
  `;

  // Broken image fallback
  const img = content.querySelector('img');
  if (img) {
    img.addEventListener('error', () => {
      img.src = PLACEHOLDER_SRC;
    });
  }

  // Close button wires focus return
  const closeBtn = getEl('modal-close-btn');
  const handleClose = () => {
    dialog.close();
    if (triggerEl) triggerEl.focus();
    closeBtn.removeEventListener('click', handleClose);
  };
  closeBtn.addEventListener('click', handleClose);

  dialog.showModal();
}

// ─── Category dropdown ─────────────────────────────────────────────────────

/**
 * Populate the category <select> with unique categories from the meals array.
 * @param {import('./api.js').Meal[]} meals
 */
export function populateCategoryDropdown(meals) {
  const select = getEl('category-select');

  // Keep only the default "All Categories" option
  select.innerHTML = '<option value="">All Categories</option>';

  const categories = [...new Set(meals.map((m) => m.category).filter(Boolean))].sort();
  categories.forEach((cat) => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str) {
  return escapeHtml(str);
}
