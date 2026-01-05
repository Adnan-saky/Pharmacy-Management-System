/**
 * Format a number as currency (BDT)
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return '৳ 0';
    }

    const num = parseFloat(amount);
    return `৳ ${num.toLocaleString('en-BD', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    })}`;
};

/**
 * Format a number with thousand separators
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) {
        return '0';
    }

    return parseFloat(num).toLocaleString('en-BD');
};

/**
 * Parse currency string to number
 * @param {string} currencyStr - Currency string like "৳ 1,000"
 * @returns {number} Parsed number
 */
export const parseCurrency = (currencyStr) => {
    if (!currencyStr) return 0;

    const cleaned = currencyStr.replace(/[৳,\s]/g, '');
    return parseFloat(cleaned) || 0;
};

/**
 * Calculate percentage
 * @param {number} value - Part value
 * @param {number} total - Total value
 * @returns {string} Percentage string with % sign
 */
export const formatPercentage = (value, total) => {
    if (!total || total === 0) return '0%';

    const percentage = (value / total) * 100;
    return `${percentage.toFixed(1)}%`;
};

/**
 * Format large numbers with K, M, B suffixes
 * @param {number} num - Number to format
 * @returns {string} Formatted string
 */
export const formatCompactNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) {
        return '0';
    }

    const absNum = Math.abs(num);

    if (absNum >= 1e9) {
        return `${(num / 1e9).toFixed(1)}B`;
    } else if (absNum >= 1e6) {
        return `${(num / 1e6).toFixed(1)}M`;
    } else if (absNum >= 1e3) {
        return `${(num / 1e3).toFixed(1)}K`;
    }

    return num.toString();
};
