/**
 * Year readout / insight strip.
 * Structural reflection only; no prescriptive language.
 */

import { store } from '../store.js';
import { getById, setHTML } from '../utils/dom.js';
import { escapeHtml } from '../utils/sanitize.js';
import { estimateEventPressure } from '../models/pressureModel.js';

const QUARTER_LABELS = ['Q1', 'Q2', 'Q3', 'Q4'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function forEachEventDayInYear(event, year, callback) {
    const start = new Date(`${event.startDate}T00:00:00`);
    const end = new Date(`${event.endDate}T00:00:00`);
    const current = new Date(start);

    while (current <= end) {
        if (current.getFullYear() === year) {
            callback(current);
        }
        current.setDate(current.getDate() + 1);
    }
}

function summarize(events, categories, valuesDeclaration, currentYear) {
    const quarterPressure = [0, 0, 0, 0];
    const quarterDays = [0, 0, 0, 0];
    const categoryDayCounts = {};
    const restorativeMonths = new Set();
    const drainingMonths = new Set();
    let restorativeDays = 0;
    let drainingDays = 0;
    let totalEventDays = 0;

    events.forEach((event) => {
        const pressure = estimateEventPressure(event).score;
        forEachEventDayInYear(event, currentYear, (date) => {
            const month = date.getMonth();
            const quarter = Math.floor(month / 3);
            quarterPressure[quarter] += pressure;
            quarterDays[quarter] += 1;
            totalEventDays += 1;

            if (event.recovery === 'restorative') {
                restorativeDays += 1;
                restorativeMonths.add(month);
            } else if (event.recovery === 'draining') {
                drainingDays += 1;
                drainingMonths.add(month);
            }

            const categoryLabel = categories[event.color] && categories[event.color].trim()
                ? categories[event.color].trim()
                : 'Unlabeled';
            categoryDayCounts[categoryLabel] = (categoryDayCounts[categoryLabel] || 0) + 1;
        });
    });

    const quarterAverages = quarterPressure.map((sum, idx) => (
        quarterDays[idx] > 0 ? sum / quarterDays[idx] : 0
    ));

    const rankedQuarters = quarterAverages
        .map((value, idx) => ({ idx, value }))
        .sort((a, b) => b.value - a.value);

    const topQuarter = rankedQuarters[0];
    const lowQuarter = rankedQuarters[rankedQuarters.length - 1];

    const categoryRanked = Object.entries(categoryDayCounts)
        .sort((a, b) => b[1] - a[1]);
    const topCategory = categoryRanked[0];

    const restorativeCoverage = restorativeDays + drainingDays > 0
        ? restorativeDays / (restorativeDays + drainingDays)
        : 0;

    const noRestorativeMonths = MONTH_SHORT.filter((_, idx) => !restorativeMonths.has(idx));

    let pressureText = 'Add events to generate a year-level pressure pattern.';
    if (totalEventDays > 0) {
        pressureText = `Estimated load concentrates in ${QUARTER_LABELS[topQuarter.idx]} and is lightest in ${QUARTER_LABELS[lowQuarter.idx]}.`;
    }

    let recoveryText = 'No declared recovery signal yet. Open space does not automatically count as recovery.';
    if (restorativeDays + drainingDays > 0) {
        recoveryText = `Declared recovery trends ${Math.round(restorativeCoverage * 100)}% restorative vs ${100 - Math.round(restorativeCoverage * 100)}% draining.`;
        if (noRestorativeMonths.length > 0) {
            recoveryText += ` Months with no declared restorative blocks: ${noRestorativeMonths.slice(0, 4).join(', ')}${noRestorativeMonths.length > 4 ? '...' : ''}.`;
        }
    }

    let distributionText = 'No category distribution yet.';
    if (topCategory && totalEventDays > 0) {
        const pct = Math.round((topCategory[1] / totalEventDays) * 100);
        distributionText = `Time distribution currently tilts toward "${topCategory[0]}" (${pct}% of event-days).`;
    }

    let alignmentText = 'Optional anchor: add "What matters most this year?" to compare intention with distribution.';
    if (valuesDeclaration && valuesDeclaration.trim()) {
        const focus = valuesDeclaration.trim();
        if (topCategory) {
            alignmentText = `Declared focus: "${focus}". Current pattern tilts toward "${topCategory[0]}". Does this match your intention?`;
        } else {
            alignmentText = `Declared focus: "${focus}". Add more events to compare intention and calendar shape.`;
        }
    }

    return {
        pressureText,
        recoveryText,
        distributionText,
        alignmentText
    };
}

/**
 * Render year-level readout summary.
 */
export function renderInsightStrip() {
    const container = getById('insightStrip');
    if (!container) return;

    const events = store.get('events') || [];
    const categories = store.get('categories') || {};
    const valuesDeclaration = store.get('valuesDeclaration') || '';
    const currentYear = store.get('currentYear');
    const summary = summarize(events, categories, valuesDeclaration, currentYear);

    const html = `
        <div class="insight-strip-header">
            <h3>Year Readout</h3>
            <p>Structural reflection from calendar inputs. No diagnostic or causal claims.</p>
        </div>
        <div class="insight-strip-grid">
            <article class="insight-card">
                <h4>Pressure Shape</h4>
                <p>${escapeHtml(summary.pressureText)}</p>
            </article>
            <article class="insight-card">
                <h4>Recovery Signal</h4>
                <p>${escapeHtml(summary.recoveryText)}</p>
            </article>
            <article class="insight-card">
                <h4>Distribution</h4>
                <p>${escapeHtml(summary.distributionText)}</p>
            </article>
            <article class="insight-card">
                <h4>Values Alignment</h4>
                <p>${escapeHtml(summary.alignmentText)}</p>
            </article>
        </div>
    `;

    setHTML(container, html);
}
