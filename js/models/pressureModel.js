/**
 * Transparent pressure estimate helpers for v2.
 */

const WEIGHTS = {
    duration: 0.6,
    controllability: 0.25,
    anticipation: 0.15
};

function getDurationDays(event) {
    const start = new Date(`${event.startDate}T00:00:00`);
    const end = new Date(`${event.endDate}T00:00:00`);
    const dayDiff = Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    return dayDiff + 1;
}

/**
 * Compute a structural pressure estimate for one event.
 * @param {Object} event - Event object
 * @returns {{score:number, components:{duration:number, controllability:number, anticipation:number}, weights:Object}}
 */
export function estimateEventPressure(event) {
    const durationDays = getDurationDays(event);
    const durationComponent = Math.min(1, durationDays / 7);
    const controllabilityComponent = event.controllability === 'low' ? 1 : 0;
    const anticipationComponent = event.anticipation ? 1 : 0;

    const score =
        (durationComponent * WEIGHTS.duration) +
        (controllabilityComponent * WEIGHTS.controllability) +
        (anticipationComponent * WEIGHTS.anticipation);

    return {
        score,
        components: {
            duration: durationComponent,
            controllability: controllabilityComponent,
            anticipation: anticipationComponent
        },
        weights: { ...WEIGHTS }
    };
}

/**
 * Predict direction/magnitude change after toggling modifiers.
 * @param {Object} event - Current event object
 * @param {'high'|'low'} nextControllability - Candidate controllability
 * @param {boolean} nextAnticipation - Candidate anticipation
 * @returns {{direction:'increase'|'decrease'|'same', delta:number}}
 */
export function predictPressureChange(event, nextControllability, nextAnticipation) {
    const current = estimateEventPressure(event).score;
    const simulated = estimateEventPressure({
        ...event,
        controllability: nextControllability,
        anticipation: nextAnticipation
    }).score;

    const delta = simulated - current;
    if (Math.abs(delta) < 0.001) {
        return { direction: 'same', delta: 0 };
    }

    return {
        direction: delta > 0 ? 'increase' : 'decrease',
        delta: Math.abs(delta)
    };
}

/**
 * Human-readable label for prediction strength.
 * @param {{direction:string, delta:number}} prediction - Prediction object
 * @returns {string}
 */
export function formatPrediction(prediction) {
    if (prediction.direction === 'same') {
        return 'No meaningful pressure change predicted.';
    }

    const strength =
        prediction.delta >= 0.2 ? 'clear' :
        prediction.delta >= 0.08 ? 'moderate' :
        'slight';

    return `${strength} ${prediction.direction} in estimated pressure.`;
}

/**
 * Visual emphasis style based on estimated pressure.
 * Higher pressure gets stronger saturation/contrast.
 * @param {Object} event - Event object
 * @returns {string}
 */
export function getPressureVisualStyle(event) {
    const score = estimateEventPressure(event).score;
    const saturation = 94 + (score * 20);
    const brightness = 94 + (score * 8);
    return `opacity: 1; filter: saturate(${saturation.toFixed(0)}%) brightness(${brightness.toFixed(0)}%);`;
}
