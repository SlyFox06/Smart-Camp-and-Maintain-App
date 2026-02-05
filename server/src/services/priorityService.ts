export const PRIORITY_KEYWORDS = {
    high: [
        'fire', 'smoke', 'spark', 'danger', 'emergency', 'leak', 'flood',
        'power outage', 'shock', 'broken security', 'lock broken', 'gas',
        'explosion', 'burning', 'critical', 'injury', 'safety'
    ],
    medium: [
        'not working', 'malfunction', 'stuck', 'slow', 'noise', 'internet',
        'wifi', 'connection', 'leaking', 'drip', 'ac not cooling', 'heating',
        'appliance', 'broken handle', 'unavailable'
    ],
    low: [
        'cosmetic', 'paint', 'scratch', 'dirty', 'suggestion', 'minor',
        'flickering', 'bulb', 'chair', 'furniture', 'dust', 'cleaning'
    ]
};

export const ASSET_PRIORITY_MAP: Record<string, string> = {
    'projector': 'medium',
    'ac': 'medium',
    'computer': 'medium',
    'light': 'low',
    'water_cooler': 'high', // Water issues can be messy
    'other': 'low'
};

export const SLA_HOURS = {
    high: 4,      // 4 hours
    medium: 24,   // 24 hours
    low: 48       // 48 hours
};

export const calculatePriority = (title: string, description: string, assetType: string): 'high' | 'medium' | 'low' => {
    const text = `${title} ${description}`.toLowerCase();

    // 1. Check for High Priority Keywords
    for (const keyword of PRIORITY_KEYWORDS.high) {
        if (text.includes(keyword)) return 'high';
    }

    // 2. Check for Medium Priority Keywords
    for (const keyword of PRIORITY_KEYWORDS.medium) {
        if (text.includes(keyword)) return 'medium';
    }

    // 3. Check for Low Priority Keywords
    for (const keyword of PRIORITY_KEYWORDS.low) {
        if (text.includes(keyword)) return 'low';
    }

    // 4. Fallback to Asset Type Default
    const assetDefault = ASSET_PRIORITY_MAP[assetType] || 'medium';
    return assetDefault as 'high' | 'medium' | 'low';
};

export const isSLABreached = (createdAt: Date, severity: string): boolean => {
    const now = new Date();
    const created = new Date(createdAt);
    const slaDurationHours = SLA_HOURS[severity as keyof typeof SLA_HOURS] || SLA_HOURS.medium;

    const diffInMilliseconds = now.getTime() - created.getTime();
    const diffInHours = diffInMilliseconds / (1000 * 60 * 60);

    return diffInHours > slaDurationHours;
};
