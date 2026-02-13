
const STORAGE_KEY = 'offline_emergencies';

export interface OfflineEmergency {
    id: string; // Temporary ID
    type: string;
    location: any;
    description?: string;
    evidence?: string;
    assetId?: string;
    timestamp: number;
}

export const saveOfflineEmergency = (emergency: Omit<OfflineEmergency, 'id' | 'timestamp'>) => {
    const current = getOfflineEmergencies();
    const newEmergency: OfflineEmergency = {
        ...emergency,
        id: crypto.randomUUID(),
        timestamp: Date.now()
    };
    current.push(newEmergency);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    return newEmergency;
};

export const getOfflineEmergencies = (): OfflineEmergency[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
};

export const clearOfflineEmergencies = () => {
    localStorage.removeItem(STORAGE_KEY);
};

export const removeOfflineEmergency = (id: string) => {
    const current = getOfflineEmergencies();
    const updated = current.filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};
