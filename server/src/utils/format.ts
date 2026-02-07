/**
 * Utility to convert snake_case keys to camelCase
 * Preserves the original value if it's not an object/array
 */
export const toCamelCase = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(toCamelCase);
    }

    const newObj: any = {};
    for (const key of Object.keys(obj)) {
        const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        newObj[camelKey] = toCamelCase(obj[key]);
    }
    return newObj;
};

/**
 * Utility to convert camelCase keys to snake_case
 * Useful for ensuring updates/inserts use correct DB column names
 */
export const toSnakeCase = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(toSnakeCase);
    }

    const newObj: any = {};
    for (const key of Object.keys(obj)) {
        const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
        newObj[snakeKey] = toSnakeCase(obj[key]);
    }
    return newObj;
};
