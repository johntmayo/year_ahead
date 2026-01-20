/**
 * Date utility functions
 */

/**
 * Get number of days in a month
 * @param {number} month - Month (0-11)
 * @param {number} year - Year
 * @returns {number} Number of days
 */
export function getDaysInMonth(month, year) {
    return new Date(year, month + 1, 0).getDate();
}

/**
 * Get the day of the week for the first day of a month
 * @param {number} month - Month (0-11)
 * @param {number} year - Year
 * @returns {number} Day of week (0-6, Sunday is 0)
 */
export function getFirstDayOfMonth(month, year) {
    return new Date(year, month, 1).getDay();
}

/**
 * Convert a Date object to a YYYY-MM-DD string
 * @param {Date} date - Date object
 * @returns {string} Date string
 */
export function dateToString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Create a Date object from a YYYY-MM-DD string (at midnight local time)
 * @param {string} dateKey - Date string in YYYY-MM-DD format
 * @returns {Date} Date object
 */
export function stringToDate(dateKey) {
    return new Date(dateKey + 'T00:00:00');
}

/**
 * Format a date key for display
 * @param {string} dateKey - Date string in YYYY-MM-DD format
 * @returns {string} Formatted date string
 */
export function formatDateForDisplay(dateKey) {
    const date = stringToDate(dateKey);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Get the row (week) number (0-based) for a given day in a month
 * @param {number} day - Day of month
 * @param {number} firstDayOfMonth - Day of week for first of month
 * @returns {number} Row number
 */
export function getRowForDay(day, firstDayOfMonth) {
    return Math.floor((day + firstDayOfMonth - 1) / 7);
}

/**
 * Get the day of week (0-6) for a given day
 * @param {number} day - Day of month
 * @param {number} firstDayOfMonth - Day of week for first of month
 * @returns {number} Day of week
 */
export function getDayOfWeekForDay(day, firstDayOfMonth) {
    return (day + firstDayOfMonth - 1) % 7;
}

/**
 * Check if an event spans multiple days
 * @param {Object} evt - Event object with startDate and endDate
 * @returns {boolean} True if event spans multiple days
 */
export function isMultiDayEvent(evt) {
    return evt.startDate !== evt.endDate;
}

/**
 * Check if a date falls between start and end dates (inclusive)
 * @param {string} dateKey - Date to check
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {boolean} True if date is within range
 */
export function isDateInRange(dateKey, startDate, endDate) {
    const date = stringToDate(dateKey);
    const start = stringToDate(startDate);
    const end = stringToDate(endDate);
    return date >= start && date <= end;
}

/**
 * Get all events that occur on a given date
 * @param {Array} events - Array of events
 * @param {string} dateKey - Date to check
 * @returns {Array} Array of events on that date
 */
export function getEventsForDate(events, dateKey) {
    const date = stringToDate(dateKey);
    return events.filter(evt => {
        const startDate = stringToDate(evt.startDate);
        const endDate = stringToDate(evt.endDate);
        return date >= startDate && date <= endDate;
    });
}

/**
 * Check if this is the start date for an event (considering view bounds)
 * @param {Object} evt - Event object
 * @param {string} dateKey - Current date key
 * @param {Date} viewStart - Start of current view
 * @param {Date} viewEnd - End of current view
 * @returns {boolean} True if this is where event should start rendering
 */
export function isEventStartDate(evt, dateKey, viewStart, viewEnd) {
    const eventStart = stringToDate(evt.startDate);
    const currentDate = stringToDate(dateKey);

    // Check if this is the actual start date of the event
    if (currentDate.getTime() === eventStart.getTime()) {
        return true;
    }

    // If event started before this view, check if this is the first day of the view
    if (eventStart < viewStart && currentDate.getTime() === viewStart.getTime()) {
        return true;
    }

    return false;
}

/**
 * Calculate how many days an event spans within a view
 * @param {Object} evt - Event object
 * @param {string} dateKey - Starting date key
 * @param {Date} viewStart - Start of view
 * @param {Date} viewEnd - End of view
 * @returns {number} Number of days to span
 */
export function calculateEventSpan(evt, dateKey, viewStart, viewEnd) {
    const eventEnd = stringToDate(evt.endDate);
    const currentDate = stringToDate(dateKey);

    // Calculate span within this view from the start date
    let spanEnd = eventEnd;
    if (eventEnd > viewEnd) {
        spanEnd = new Date(viewEnd);
    }

    // Calculate how many days from current date to end of span within view
    const daysFromCurrent = Math.ceil((spanEnd - currentDate) / (1000 * 60 * 60 * 24)) + 1;

    return Math.max(1, daysFromCurrent);
}

/**
 * Check if a multi-day event should start rendering on this row (at this day)
 * @param {Object} evt - Event object
 * @param {string} dateKey - Current date key
 * @param {number} row - Current row number
 * @param {number} firstDayOfMonth - First day of month
 * @param {Date} monthStart - Start of month
 * @param {Date} monthEnd - End of month
 * @param {number} daysInMonth - Number of days in month
 * @returns {boolean} True if event should start on this row
 */
export function isEventStartOnRow(evt, dateKey, row, firstDayOfMonth, monthStart, monthEnd, daysInMonth) {
    const eventStart = stringToDate(evt.startDate);
    const eventEnd = stringToDate(evt.endDate);
    const currentDate = stringToDate(dateKey);
    const currentDay = currentDate.getDate();
    const currentRow = getRowForDay(currentDay, firstDayOfMonth);

    if (currentRow !== row) {
        return false;
    }

    // Determine the actual start date for this event in this month
    let eventStartInMonth = eventStart;
    if (eventStart < monthStart) {
        eventStartInMonth = new Date(monthStart);
    }

    // Check if event ends before this row - don't render
    const rowStartDay = Math.max(1, row * 7 - firstDayOfMonth + 1);
    if (rowStartDay > 1) {
        const rowStartDate = new Date(monthStart);
        rowStartDate.setDate(rowStartDay);
        if (eventEnd < rowStartDate) {
            return false;
        }
    } else if (eventEnd < monthStart) {
        return false;
    }

    // Determine which row the event starts on
    const eventStartDay = eventStartInMonth.getDate();
    const eventStartRow = getRowForDay(eventStartDay, firstDayOfMonth);

    if (eventStartRow === row) {
        // Event starts on this row - only render on the actual start day
        return currentDate.getTime() === eventStartInMonth.getTime();
    } else if (eventStartRow < row) {
        // Event started on a previous row - render on first day of this row if event continues
        const rowFirstDay = Math.max(1, row * 7 - firstDayOfMonth + 1);
        return currentDay === rowFirstDay;
    }

    return false;
}

/**
 * Calculate how many days an event spans within a specific row
 * @param {Object} evt - Event object
 * @param {string} dateKey - Starting date key
 * @param {number} row - Current row
 * @param {number} firstDayOfMonth - First day of month
 * @param {number} daysInMonth - Number of days in month
 * @param {Date} monthStart - Start of month
 * @param {Date} monthEnd - End of month
 * @returns {number} Number of days to span
 */
export function calculateEventSpanInRow(evt, dateKey, row, firstDayOfMonth, daysInMonth, monthStart, monthEnd) {
    const eventEnd = stringToDate(evt.endDate);
    const currentDate = stringToDate(dateKey);
    const currentDay = currentDate.getDate();

    // Determine the bounds of this row
    const rowEndDay = Math.min(daysInMonth, (row + 1) * 7 - firstDayOfMonth);

    // Determine where the event ends (within month or event end)
    let eventEndDay = eventEnd.getDate();
    if (eventEnd > monthEnd) {
        eventEndDay = daysInMonth;
    }

    // Calculate span: from current day to either end of event or end of row
    const spanEndDay = Math.min(eventEndDay, rowEndDay);
    const span = spanEndDay - currentDay + 1;

    return Math.max(1, span);
}
