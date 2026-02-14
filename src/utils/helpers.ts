import type { ComplaintStatus, ComplaintSeverity, Technician } from '../types';
import { mockComplaints, mockTechnicians } from '../data/mockData';

// Generate random OTP
export const generateOTP = (): string => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

// Format date to readable string
export const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return 'N/A';
    try {
        return new Intl.DateTimeFormat('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    } catch (e) {
        return 'Invalid Date';
    }
};

// Calculate time difference
export const getTimeDifference = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
};

// Get status color
export const getStatusColor = (status: ComplaintStatus): string => {
    const colors: Record<ComplaintStatus, string> = {
        reported: 'bg-blue-500',
        assigned: 'bg-yellow-500',
        in_progress: 'bg-orange-500',
        resolved: 'bg-green-500',
        closed: 'bg-gray-500',
        rejected: 'bg-red-500',
        work_submitted: 'bg-purple-500',
        work_approved: 'bg-teal-500',
        rework_required: 'bg-red-500',
        feedback_pending: 'bg-teal-500',
        waiting_warden_approval: 'bg-orange-400'
    };
    return colors[status] || 'bg-gray-500';
};

// Get severity color
export const getSeverityColor = (severity: ComplaintSeverity): string => {
    const colors: Record<ComplaintSeverity, string> = {
        low: 'bg-green-500',
        medium: 'bg-yellow-500',
        high: 'bg-red-500',
        critical: 'bg-red-700'
    };
    return colors[severity] || 'bg-gray-500';
};

// Get status badge style
export const getStatusBadgeStyle = (status: ComplaintStatus): string => {
    const styles: Record<ComplaintStatus, string> = {
        reported: 'bg-blue-100 text-blue-800 border-blue-200',
        assigned: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        in_progress: 'bg-orange-100 text-orange-800 border-orange-200',
        resolved: 'bg-green-100 text-green-800 border-green-200',
        closed: 'bg-gray-100 text-gray-800 border-gray-200',
        rejected: 'bg-red-100 text-red-800 border-red-200',
        work_submitted: 'bg-purple-100 text-purple-800 border-purple-200',
        work_approved: 'bg-teal-100 text-teal-800 border-teal-200',
        rework_required: 'bg-red-100 text-red-800 border-red-200',
        feedback_pending: 'bg-teal-100 text-teal-800 border-teal-200',
        waiting_warden_approval: 'bg-orange-50 text-orange-800 border-orange-200'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
};

// Get severity badge style
export const getSeverityBadgeStyle = (severity: ComplaintSeverity): string => {
    const styles: Record<ComplaintSeverity, string> = {
        low: 'bg-green-100 text-green-800 border-green-200',
        medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        high: 'bg-red-100 text-red-800 border-red-200',
        critical: 'bg-red-200 text-red-900 border-red-300'
    };
    return styles[severity] || 'bg-gray-100 text-gray-800';
};

// Validate email
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate phone
export const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,6}[)]?[-\s.]?[0-9]{1,6}[-\s.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone);
};

// Generate QR code data
export const generateQRData = (assetId: string): string => {
    return JSON.stringify({
        assetId,
        timestamp: new Date().toISOString(),
        type: 'asset_scan'
    });
};

// Parse QR code data
export const parseQRData = (qrData: string): { assetId: string; timestamp: string; type: string } | null => {
    try {
        return JSON.parse(qrData);
    } catch {
        return null;
    }
};

// Calculate resolution time in minutes
export const calculateResolutionTime = (createdAt: Date, resolvedAt: Date): number => {
    const diff = new Date(resolvedAt).getTime() - new Date(createdAt).getTime();
    return Math.floor(diff / 60000);
};

// Format resolution time
export const formatResolutionTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours < 24) return `${hours}h ${remainingMinutes}m`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
};

// Get geolocation
export const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            },
            (error) => {
                reject(error);
            }
        );
    });
};

// AI-based severity classification (simplified rule-based for now)
export const classifySeverity = (title: string, description: string): ComplaintSeverity => {
    const text = `${title} ${description}`.toLowerCase();

    // Critical keywords
    const criticalKeywords = ['fire', 'smoke', 'electric shock', 'gas leak', 'emergency', 'danger'];
    if (criticalKeywords.some(keyword => text.includes(keyword))) {
        return 'critical';
    }

    // High priority keywords
    const highKeywords = ['not working', 'broken', 'damaged', 'leaking', 'sparking', 'burning smell'];
    if (highKeywords.some(keyword => text.includes(keyword))) {
        return 'high';
    }

    // Medium priority keywords
    const mediumKeywords = ['slow', 'noisy', 'flickering', 'loose', 'stuck'];
    if (mediumKeywords.some(keyword => text.includes(keyword))) {
        return 'medium';
    }

    return 'low';
};

// File size formatter
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

// Validate file type
export const isValidImageFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return validTypes.includes(file.type);
};

export const isValidVideoFile = (file: File): boolean => {
    const validTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    return validTypes.includes(file.type);
};

// Check if asset has active complaint
export const hasActiveComplaint = (assetId: string): boolean => {
    const activeStatuses: ComplaintStatus[] = ['reported', 'assigned', 'in_progress'];
    return mockComplaints.some(c => c.assetId === assetId && activeStatuses.includes(c.status));
};

// Auto-assign technician based on category (asset type) and building
export const findBestTechnician = (assetType: string, building?: string): Technician | null => {
    // 1. Filter by specialization and online status
    const specializedTechs = mockTechnicians.filter(t =>
        t.specialization.includes(assetType) && t.availability !== 'offline'
    );

    if (specializedTechs.length === 0) {
        // Fallback to any available technician if no specialist found (optional constraint)
        const availableTechs = mockTechnicians.filter(t => t.availability !== 'offline');
        if (availableTechs.length === 0) return null;
        return sortTechnicians(availableTechs)[0];
    }

    // 2. Prioritize technicians in the same building
    if (building) {
        const onsiteTechs = specializedTechs.filter(t => t.assignedBuilding === building);
        if (onsiteTechs.length > 0) {
            return sortTechnicians(onsiteTechs)[0];
        }
    }

    // 3. Fallback to best available specialist anywhere
    return sortTechnicians(specializedTechs)[0];
};

// Helper to sort technicians by availability and workload
const sortTechnicians = (techs: Technician[]): Technician[] => {
    return techs.sort((a, b) => {
        // Priority 1: Availability (Available > Busy)
        if (a.availability === 'available' && b.availability !== 'available') return -1;
        if (a.availability !== 'available' && b.availability === 'available') return 1;

        // Priority 2: Workload (Less assigned complaints first)
        return a.assignedComplaints - b.assignedComplaints;
    });
};
