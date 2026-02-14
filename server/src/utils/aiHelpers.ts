
/**
 * Detects the priority of a complaint based on its description and category.
 */
export const detectPriority = (description: string, category?: string): 'low' | 'medium' | 'high' | 'critical' => {
    const text = description.toLowerCase();

    // Critical Keywords (Safety/Emergency)
    const criticalKeywords = ['spark', 'fire', 'shock', 'leakage', 'smoke', 'stuck', 'flood', 'short circuit', 'break down', 'bleeding', 'trapped', 'unconscious', 'burning', 'explosive', 'gas', 'danger', 'hospital'];
    if (criticalKeywords.some(key => text.includes(key))) return 'critical';

    // High priority keywords
    const highKeywords = ['not working', 'no power', 'no water', 'broken', 'damaged', 'emergency', 'help', 'hazard'];
    if (highKeywords.some(key => text.includes(key))) return 'high';

    // Functional issues but not critical -> Medium
    const mediumKeywords = ['clogged', 'faulty', 'leaking', 'slow', 'flickering', 'noisy'];
    if (mediumKeywords.some(key => text.includes(key))) return 'medium';

    // Default to Low for minor/cosmetic issues
    return 'low';
};

/**
 * Detects the required skill based on complaint description and selected category.
 */
export const detectSkill = (description: string, category?: string): string => {
    const text = description.toLowerCase();
    const cat = category?.toLowerCase() || '';

    // Priority Check by Category
    if (cat === 'electrical') return 'Electrician';
    if (cat === 'plumbing') return 'Plumber';
    if (cat === 'it/network' || cat === 'wifi') return 'IT Technician';
    if (cat === 'furniture') return 'Maintenance Technician';
    if (cat === 'cleanliness' || cat === 'cleaning') return 'Cleaner';

    // Electrical
    if (text.includes('light') || text.includes('fan') || text.includes('socket') || text.includes('wire') || text.includes('shock') || text.includes('power') || text.includes('ac') || text.includes('air conditioner') || text.includes('cooler') || text.includes('cooling')) {
        return 'Electrician';
    }

    // Plumbing
    if (text.includes('water') || text.includes('leak') || text.includes('tap') || text.includes('flush') || text.includes('drain') || text.includes('toilet') || text.includes('pipe')) {
        return 'Plumber';
    }

    // IT / Network
    if (text.includes('router') || text.includes('wifi') || text.includes('internet') || text.includes('computer') || text.includes('lan') || text.includes('network')) {
        return 'IT Technician';
    }

    // Furniture / Carpentry
    if (text.includes('chair') || text.includes('table') || text.includes('door') || text.includes('window') || text.includes('bed') || text.includes('cupboard')) {
        return 'Maintenance Technician';
    }

    // Cleaning
    if (text.includes('trash') || text.includes('dirty') || text.includes('garbage') || text.includes('smell') || text.includes('clean')) {
        return 'Cleaner';
    }

    return 'Maintenance Technician'; // Default
};

/**
 * Detects if a complaint text indicates an emergency situation.
 */
export const isEmergency = (description: string): boolean => {
    const text = description.toLowerCase();
    const emergencyKeywords = ['stuck', 'help', 'fire', 'bleeding', 'trapped', 'unconscious', 'emergency', 'danger', 'hospital', 'medical'];
    return emergencyKeywords.some(key => text.includes(key));
};
