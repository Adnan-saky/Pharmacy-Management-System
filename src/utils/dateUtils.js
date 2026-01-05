/**
 * Format a date for display
 * @param {Date|string} date - Date to format
 * @param {string} formatStr - Format string (default: 'MMM dd, yyyy')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;

        if (isNaN(dateObj.getTime())) {
            return '';
        }

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[dateObj.getMonth()];
        const day = dateObj.getDate().toString().padStart(2, '0');
        const year = dateObj.getFullYear();

        // Simple format support
        if (formatStr === 'MMM dd, yyyy') {
            return `${month} ${day}, ${year}`;
        } else if (formatStr === 'yyyy-MM-dd') {
            const monthNum = (dateObj.getMonth() + 1).toString().padStart(2, '0');
            return `${year}-${monthNum}-${day}`;
        } else if (formatStr === 'MM/dd/yyyy') {
            const monthNum = (dateObj.getMonth() + 1).toString().padStart(2, '0');
            return `${monthNum}/${day}/${year}`;
        }

        return dateObj.toLocaleDateString();
    } catch (error) {
        console.error('Error formatting date:', error);
        return '';
    }
};

/**
 * Format a date for input fields (YYYY-MM-DD)
 */
export const formatDateForInput = (date) => {
    return formatDate(date, 'yyyy-MM-dd');
};

/**
 * Get today's date
 */
export const getToday = () => {
    return new Date();
};

/**
 * Get today's date as string (YYYY-MM-DD)
 */
export const getTodayString = () => {
    return formatDateForInput(new Date());
};

/**
 * Get start of current week
 */
export const getWeekStart = () => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday
    const diff = now.getDate() - day;
    return new Date(now.setDate(diff));
};

/**
 * Get start of current month
 */
export const getMonthStart = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
};

/**
 * Check if a date is within a range
 * @param {Date|string} date - Date to check
 * @param {Date|string} start - Start of range
 * @param {Date|string} end - End of range
 */
export const isWithinRange = (date, start, end) => {
    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const startObj = typeof start === 'string' ? new Date(start) : start;
        const endObj = typeof end === 'string' ? new Date(end) : end;

        return dateObj >= startObj && dateObj <= endObj;
    } catch (error) {
        console.error('Error checking date range:', error);
        return false;
    }
};

/**
 * Get date N days ago
 */
export const getDaysAgo = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
};

/**
 * Parse date string to Date object
 */
export const parseDate = (dateStr) => {
    try {
        const parsed = new Date(dateStr);
        if (isNaN(parsed.getTime())) {
            return new Date();
        }
        return parsed;
    } catch (error) {
        console.error('Error parsing date:', error);
        return new Date();
    }
};

