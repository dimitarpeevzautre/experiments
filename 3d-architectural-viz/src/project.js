/* CAROLINE — project context: the off-grid micro-estate brief.
   Data-first: the PROJECT object is the single source of truth so budgeting,
   planning and progress tracking can attach to the same records later. */
(function () {
  'use strict';

  const PROJECT = {
    title: 'The Off-Grid Micro-Estate',
    overview: [
      ['Plot', '40 × 60 m — 2,400 m²'],
      ['Topography', 'Gentle southern slope, ideal for solar exposure and gravity-fed infrastructure'],
      ['Philosophy', 'Passive resource management, automated solar-syncing, zero-grid reliance']
    ],
    components: [
      {
        id: 'energy',
        name: 'The energy plant',
        spec: '11 kWp photovoltaic array · 10 kWh lithium storage · 4–5 kW auto-start (AGS) backup inverter generator',
        motivation: 'Highly asymmetric sizing. The oversized 11 kWp array keeps the system generating enough power even on heavily overcast winter days, while the compact 10 kWh battery is optimised for overnight residential loads rather than multi-day storage. A smart generator bridges rare winter deficits far more cost-effectively than adding heavy chemical batteries.',
        budget: null, status: null, progress: null
      },
      {
        id: 'living',
        name: 'The living space',
        spec: '8 × 6 × 3 m bungalow (48 m²) · high-efficiency inverter heat pump for summer cooling · 4–6 kW wood stove with external air intake for winter heating',
        motivation: 'Seasonal load shifting. In summer, cooling runs entirely on real-time solar surplus. In winter, heating — the heaviest off-grid electrical drain — shifts entirely to biomass. That preserves the 10 kWh battery, keeps generator runtimes low, and lets the building’s thermal mass hold a safe baseline above freezing.',
        budget: null, status: null, progress: null
      },
      {
        id: 'hydro',
        name: 'The hydro loop',
        spec: '40 m borehole with deep submersible pump on a smart solar-clipping controller · 10,000-litre cistern at the high point of the slope',
        motivation: 'Water as a battery. Pumping from 40 m is energy-intensive, so instead of drawing on the electrical battery at night or under cloud, the pump runs only between 11:00 and 15:00 when solar production peaks. The 10 m³ cistern is a potential-energy reservoir: the slope delivers gravity-fed, zero-power irrigation.',
        budget: null, status: null, progress: null
      },
      {
        id: 'pond',
        name: 'The ecosystem',
        spec: 'Natural swimming pond · chemical-free biological filtration · 50–100 W ultra-low-draw eco-pump running continuously',
        motivation: 'Low, steady-state baseload. Unlike the borehole pump, pond filtration needs constant, predictable circulation — about 2.4 kWh per day, easily absorbed by the summer surplus and intentionally scaled down or winterised in the dark months when biological activity naturally ceases.',
        budget: null, status: null, progress: null
      }
    ],
    roadmap: 'Next: planning and build progress will attach to these components.'
  };
  window.PROJECT = PROJECT;

  // merge the budget (injected at build time from src/budget.json)
  const BUDGET = window.BUDGET || { currency: 'EUR', note: '', components: {} };
  const fmt = new Intl.NumberFormat('en', { style: 'currency', currency: BUDGET.currency || 'EUR', maximumFractionDigits: 0 });
  let plannedTotal = 0, spentTotal = 0;
  for (const c of PROJECT.components) {
    c.budget = BUDGET.components[c.id] || null;
    if (c.budget) { plannedTotal += c.budget.planned || 0; spentTotal += c.budget.spent || 0; }
  }

  // ---------- drawer ----------
  const drawer = document.createElement('aside');
  drawer.id = 'drawer';
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-label', 'Project brief');
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  drawer.innerHTML = `
    <button id="drawer-close" type="button" aria-label="Close project brief">×</button>
    <p class="eyebrow">Project brief</p>
    <h2>${esc(PROJECT.title)}</h2>
    <dl class="overview">
      ${PROJECT.overview.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}
    </dl>
    <div class="budget-summary">
      <div class="budget-line"><span>Draft budget</span><b>${fmt.format(plannedTotal)}</b></div>
      <div class="budget-line"><span>Spent</span><b>${fmt.format(spentTotal)}</b></div>
      <p class="budget-note">${esc(BUDGET.note || '')}</p>
    </div>
    ${PROJECT.components.map((c, i) => `
      <section class="component" data-id="${c.id}" tabindex="0" role="button"
               aria-label="Focus ${esc(c.name)} on the site model">
        <p class="eyebrow">${String(i + 1).padStart(2, '0')} · ${esc(c.name)}<span class="focus-hint">view on site →</span></p>
        <p class="spec">${esc(c.spec)}</p>
        <p class="why">${esc(c.motivation)}</p>
        ${c.budget ? `
        <div class="budget">
          <div class="bbar"><i style="width:${c.budget.planned ? Math.min(100, c.budget.spent / c.budget.planned * 100).toFixed(1) : 0}%"></i></div>
          <span>${fmt.format(c.budget.spent)} spent of ${fmt.format(c.budget.planned)} planned</span>
        </div>` : ''}
      </section>`).join('')}
    <p class="roadmap">${esc(PROJECT.roadmap)}</p>
  `;
  document.body.appendChild(drawer);

  const chip = document.getElementById('chip-project');
  const closeBtn = drawer.querySelector('#drawer-close');
  let open = false;
  let systemsWereOn = false;
  function setOpen(v) {
    open = v;
    drawer.classList.toggle('open', open);
    chip.classList.toggle('active', open);
    // surface the matching site systems while the brief is open
    const api = window.caroline;
    if (api) {
      if (open) { systemsWereOn = api.getSystems(); api.setSystems(true); }
      else if (!systemsWereOn) api.setSystems(false);
    }
  }
  chip.addEventListener('click', () => setOpen(!open));
  closeBtn.addEventListener('click', () => setOpen(false));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) setOpen(false); });

  // drawer card → fly the camera to that component
  for (const card of drawer.querySelectorAll('.component')) {
    const go = () => window.caroline && window.caroline.focusComponent(card.dataset.id);
    card.addEventListener('click', go);
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  }
  // clicked object in the scene → open the drawer at that card
  window.addEventListener('caroline:pick', (e) => {
    if (!open) setOpen(true);
    const card = drawer.querySelector(`.component[data-id="${e.detail.id}"]`);
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.remove('flash');
    void card.offsetWidth; // restart the animation
    card.classList.add('flash');
  });
})();
