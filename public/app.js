const $ = id => document.getElementById(id);
const key = 'wayfarer-trips-v1';
let trips = [];
try { const saved = JSON.parse(localStorage.getItem(key) || '[]'); if (Array.isArray(saved) && saved.every(t => typeof t.id === 'string' && typeof t.destination === 'string' && typeof t.start === 'string' && typeof t.end === 'string' && Number.isFinite(t.budget) && Array.isArray(t.items) && t.items.every(i => typeof i.id === 'string' && typeof i.title === 'string' && typeof i.date === 'string' && Number.isFinite(i.cost)))) trips = saved; else throw Error(); } catch { $('status').textContent = 'Saved trips could not be loaded. You can start a new trip.'; }
const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date = value => new Date(value + 'T12:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
function save() { try { localStorage.setItem(key, JSON.stringify(trips)); $('status').textContent = ''; } catch { $('status').textContent = 'Browser storage is unavailable. These changes will be lost when you leave.'; } render(); }
function render() {
  $('count').textContent = trips.length;
  $('trips').innerHTML = trips.length ? trips.map(t => {
    const total = t.items.reduce((sum, item) => sum + item.cost, 0);
    return `<article class="trip"><div class="trip-head"><div><h3>${escape(t.destination)}</h3><span class="muted">${escape(date(t.start))} — ${escape(date(t.end))}</span></div><div class="actions"><button data-add="${escape(t.id)}">＋ Add activity</button><button class="icon" data-delete="${escape(t.id)}" aria-label="Delete trip">✕</button></div></div><div class="budget ${total > t.budget ? 'over' : ''}">${money(total)} planned of ${money(t.budget)} · ${total > t.budget ? money(total-t.budget)+' over budget' : money(t.budget-total)+' remaining'}<progress max="${t.budget || 1}" value="${Math.min(total,t.budget || 1)}" aria-label="Budget allocated"></progress></div><ul class="itinerary">${t.items.length ? [...t.items].sort((a,b)=>a.date.localeCompare(b.date)).map(i=>`<li><div><strong>${escape(i.title)}</strong><small>${escape(date(i.date))}</small></div><div class="cost">${money(i.cost)} <button class="icon" data-trip="${escape(t.id)}" data-remove="${escape(i.id)}" aria-label="Remove activity">×</button></div></li>`).join('') : '<li class="muted">A blank itinerary, full of possibility. Add your first activity.</li>'}</ul></article>`;
  }).join('') : '<div class="empty"><span aria-hidden="true">✳</span><h3>Where will you go next?</h3><p>Your adventures will live here. Start by planning your first trip.</p><button id="first-trip">Plan my first trip ↗</button></div>';
}
function openTrip() { $('trip-form').reset(); $('trip-dialog').showModal(); }
$('open-trip').onclick = openTrip;
document.addEventListener('click', e => {
  const button = e.target.closest('button'); if (!button) return;
  if (button.id === 'first-trip') openTrip();
  if (button.dataset.close) $(button.dataset.close).close();
  if (button.dataset.delete && confirm('Delete this trip and all its activities?')) { trips = trips.filter(t=>t.id!==button.dataset.delete); save(); }
  if (button.dataset.add) { const t = trips.find(t=>t.id===button.dataset.add); $('item-form').reset(); $('item-form').dataset.trip = t.id; const input = $('item-form').elements.date; input.min=t.start; input.max=t.end; input.value=t.start; $('item-dialog').showModal(); }
  if (button.dataset.remove) { const t=trips.find(t=>t.id===button.dataset.trip); t.items=t.items.filter(i=>i.id!==button.dataset.remove); save(); }
});
$('trip-form').onsubmit = e => { e.preventDefault(); const f=e.target.elements; if(f.end.value < f.start.value) { f.end.setCustomValidity('Return must be on or after departure.'); f.end.reportValidity(); return; } const destination=f.destination.value.trim(); if(!destination) { f.destination.setCustomValidity('Enter a destination.'); f.destination.reportValidity(); return; } trips.push({id:crypto.randomUUID(),destination,start:f.start.value,end:f.end.value,budget:Number(f.budget.value),items:[]}); save(); $('trip-dialog').close(); };
$('trip-form').addEventListener('input', e=>e.target.setCustomValidity(''));
$('item-form').onsubmit = e => { e.preventDefault(); const f=e.target.elements; const title=f.title.value.trim(); if(!title){f.title.setCustomValidity('Enter an activity.');f.title.reportValidity();return;} const t=trips.find(t=>t.id===e.target.dataset.trip); t.items.push({id:crypto.randomUUID(),title,date:f.date.value,cost:Number(f.cost.value)}); save(); $('item-dialog').close(); };
$('item-form').addEventListener('input',e=>e.target.setCustomValidity(''));
render();
