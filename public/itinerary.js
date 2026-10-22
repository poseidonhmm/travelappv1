import {recommendActivities} from './activities.js';
// Pure itinerary edits retain the v1 saved-plan shape and never mutate catalogue records.
export function createActivityPlan(records, destinationId, days, preferences = {}) {
 const selected = recommendActivities(records, destinationId, {...preferences, days}).slice(0, days * 2);
 return Array.from({length: days}, (_, index) => ({
  label: index === 0 ? 'Arrival & first discoveries' : 'Room to explore',
  items: selected.filter((_, i) => i % days === index).map(a => ({key: 'activity-' + a.id, activityId: a.id}))
 }));
}

export function editPlan(plan, {action, dayIndex, itemIndex, targetDay, item} = {}) {
 if (!Array.isArray(plan) || !Number.isInteger(dayIndex) || !plan[dayIndex] || !Array.isArray(plan[dayIndex].items)) return plan;
 const next = structuredClone(plan);
 const items = next[dayIndex].items;
 if (action === 'add') {
  if (!item || typeof item.key !== 'string' || (!item.activityId && !item.template)) return plan;
  items.push(structuredClone(item));
 } else {
  if (!Number.isInteger(itemIndex) || itemIndex < 0 || itemIndex >= items.length) return plan;
  if (action === 'remove') items.splice(itemIndex, 1);
  else if (action === 'up' && itemIndex > 0) [items[itemIndex - 1], items[itemIndex]] = [items[itemIndex], items[itemIndex - 1]];
  else if (action === 'down' && itemIndex < items.length - 1) [items[itemIndex + 1], items[itemIndex]] = [items[itemIndex], items[itemIndex + 1]];
  else if (action === 'move' || action === 'next') {
   const destination = action === 'next' ? dayIndex + 1 : targetDay;
   if (!Number.isInteger(destination) || destination === dayIndex || !Array.isArray(next[destination]?.items)) return plan;
   next[destination].items.push(...items.splice(itemIndex, 1));
  } else return plan;
 }
 return next;
}

export function planActivityRecords(plan, records) {
 const byId = new Map(records.map(a => [a.id, a]));
 return plan.flatMap(day => day.items.map(item => byId.get(item.activityId) || null));
}
