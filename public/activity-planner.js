import {recommendActivities, priceUsability, summarizeActivityCosts, activityFlags, safeSourceUrl, priceEvidenceMatches} from './activities.js';

const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const words = value => String(value || '').replaceAll('-', ' ');
const money = (amount, currency) => new Intl.NumberFormat(undefined, {style:'currency', currency, maximumFractionDigits:2}).format(amount);
const range = p => money(p.min, p.currency) + (p.min === p.max ? '' : '–' + money(p.max, p.currency));
function link(url, label) {
 if (!safeSourceUrl(url)) return '';
 return '<a href="' + escape(url) + '" target="_blank" rel="noopener noreferrer">' + escape(label) + ' ↗</a>';
}
export function activityPriceHTML(activity) {
 const price = activity?.price;
 if (!price) return '<div class="activity-price price-pending">Price unavailable</div>';
 const evidence = priceUsability(price);
 const recordUsable = ['ready-for-review', 'approved'].includes(activity.verification?.status);
 const sourceMatches = priceEvidenceMatches(activity);
 const usable = evidence.usable && recordUsable && sourceMatches;
 return '<div class="activity-price ' + (usable ? '' : 'price-pending') + '"><strong>' +
  (usable ? escape(range(price)) + ' ' + escape(words(price.unit)) : 'Estimate pending verification') + '</strong>' +
  '<span>' + escape(words(evidence.effectiveConfidence || price.confidence)) + ' confidence · Checked ' + escape(price.checkedAt || 'date unavailable') + '</span>' +
  (price.covers ? '<span>' + escape(price.covers) + '</span>' : '') +
  '<span>' + link(price.sourceUrl, 'Price source') + ' · ' + (price.reviewStatus === 'approved' ? 'Price reviewed' : price.reviewStatus === 'ready-for-review' ? 'Price awaiting human review' : 'Price ' + escape(words(price.reviewStatus))) + '</span>' +
  (price.notes ? '<span>' + escape(price.notes) + '</span>' : '') +
  (!usable ? '<span>Excluded from estimates: ' + escape(!recordUsable ? 'activity ' + words(activity.verification?.status) : !sourceMatches ? 'price source evidence does not match' : evidence.flags.map(words).join('; ')) + '.</span>' : '') + '</div>';
}
export function activityEvidenceHTML(activity) {
 const status = activity.verification?.status;
 const flags = activityFlags(activity);
 return '<div class="activity-evidence"><span class="tag">' + (status === 'approved' ? 'Reviewed activity' : status === 'ready-for-review' ? 'Awaiting human review' : escape(words(status || 'record unavailable'))) + '</span>' +
  (activity.location?.label ? '<p>' + escape(activity.location.label) + '</p>' : '<p>Location details need research.</p>') +
  (activity.durationMinutes ? '<p>Allow approximately ' + escape(activity.durationMinutes) + ' minutes · ' + link(activity.durationSourceUrl, 'Duration source') + '</p>' : '') +
  '<details><summary>Evidence & planning notes</summary><p>' + (activity.sources || []).map(s => link(s.url, s.title || 'Activity source')).filter(Boolean).join('<br>') + '</p>' +
  '<p>Sources last checked ' + escape(activity.lastCheckedAt || 'date unavailable') + '. Human review: ' + escape(words(status)) + '.</p>' +
  (activity.seasonality?.verified && activity.seasonality?.restriction ? '<p>' + escape(activity.seasonality.restriction) + ' ' + link(activity.seasonality.sourceUrl, 'Seasonal information') + '</p>' : '<p>Seasonal suitability has not been verified.</p>') +
  (activity.considerations || []).map(c => '<p><strong>' + escape(words(c.type)) + ':</strong> ' + escape(c.text) + ' ' + link(c.sourceUrl, 'Read guidance') + '</p>').join('') +
  (flags.length ? '<p class="review-flags">Review flags: ' + escape(flags.map(f => typeof f === 'string' ? words(f) : f.message || f.code || '').join('; ')) + '</p>' : '') +
  '</details></div>';
}
export function activityCostsHTML(records, {compact = false} = {}) {
 const total = summarizeActivityCosts(records);
 if (!total.totalCount) return '';
 const prices = total.groups.map(g => '<strong>' + escape(range(g)) + ' ' + escape(words(g.unit)) + '</strong>').join(' + ');
 return '<div class="activity-costs ' + (compact ? 'compact' : '') + '">' +
  '<span>' + (compact ? 'Estimated day activity costs' : 'Estimated activity costs') + '</span>' +
  (total.knownCount ? '<p>' + prices + ' for ' + total.knownCount + ' of ' + total.totalCount + ' activities.</p>' : '<p>Price estimates unavailable for these activities.</p>') +
  (total.unknownCount ? '<p>' + total.unknownCount + (total.unknownCount === 1 ? ' activity has an unknown or unusable price.' : ' activities have unknown or unusable prices.') + ' This estimate is incomplete.</p>' : '') +
  (!compact ? '<small>Activity costs only, using listed ticket or group units. No flights, accommodation, meals or transfers. Currencies and pricing units are shown separately; check party size and eligibility with each provider. Unreviewed prices are provisional.</small>' : '') + '</div>';
}
export function recommendedActivitiesHTML(records, destinationId, preferences, days) {
 const activities = recommendActivities(records, destinationId, {...preferences, days});
 return '<section class="activity-recommendations panel"><div class="eyebrow">MAKE ROOM FOR SOMETHING MEMORABLE</div><h2>Experiences in this destination</h2>' +
  '<p>Source-backed ideas chosen for your interests. Check current information with the provider before making plans.</p>' +
  (activities.length ? activities.map(a => '<article class="activity-option"><div class="activity-option-heading"><h3>' + escape(a.name) + '</h3><span class="tag">' + escape(words(a.category)) + '</span></div><p>' + escape(a.description) + '</p>' +
   activityEvidenceHTML(a) + activityPriceHTML(a) + '<div class="add-recommendation"><label for="activity-day-' + escape(a.id) + '">Add to day</label><select id="activity-day-' + escape(a.id) + '">' +
   Array.from({length:days}, (_, i) => '<option value="' + i + '">Day ' + (i+1) + '</option>').join('') + '</select><button class="outline" data-action="add-recommended" data-activity-id="' + escape(a.id) + '">+ Add experience</button></div></article>').join('') :
   '<div class="research-empty">Destination-specific activity research is still pending here. Your editable ideas remain available below; they have no verified attraction or price attached.</div>') + '</section>';
}
