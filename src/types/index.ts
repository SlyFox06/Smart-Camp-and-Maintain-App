// User Types
export type UserRole = 'student' | 'technician' | 'admin';

export interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    department?: string;
    avatar?: string;
}

// Asset Types
export interface Asset {
    id: string;
    name: string;
    type: 'projector' | 'ac' | 'computer' | 'light' | 'water_cooler' | 'other';
    location: string;
    building: string;
    floor: string;
    room: string;
    department: string;
    qrCode: string;
    status: 'operational' | 'under_maintenance' | 'faulty';
    lastMaintenance?: Date;
    installationDate: Date;
}

// Complaint Types
export type ComplaintStatus = 'reported' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
export type ComplaintSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Complaint {
    id: string;
    assetId: string;
    asset?: Asset;
    studentId: string;
    student?: User;
    technicianId?: string;
    technician?: User;
    title: string;
    description: string;
    status: ComplaintStatus;
    severity: ComplaintSeverity;
    images: string[];
    video?: string;
    location: {
        latitude: number;
        longitude: number;
        address: string;
    };
    otp?: string;
    otpVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    assignedAt?: Date;
    resolvedAt?: Date;
    closedAt?: Date;
    repairEvidence?: string;
    statusHistory: StatusUpdate[];
}

export interface StatusUpdate {
    status: ComplaintStatus;
    timestamp: Date;
    updatedBy: string;
    notes?: string;
}

// Technician Types
export interface Technician extends User {
    specialization: string[];
    assignedBuilding?: string; // e.g., "A-Block", "Library"
    availability: 'available' | 'busy' | 'offline';
    currentLocation?: {
        latitude: number;
        longitude: number;
    };
    assignedComplaints: number;
    completedComplaints: number;
    averageResolutionTime: number; // in minutes
    rating: number;
}

// Analytics Types
export interface AnalyticsData {
    totalComplaints: number;
    activeComplaints: number;
    resolvedComplaints: number;
    averageResolutionTime: number;
    complaintsByStatus: Record<ComplaintStatus, number>;
    complaintsBySeverity: Record<ComplaintSeverity, number>;
    complaintsByAssetType: Record<string, number>;
    topFailingAssets: Array<{
        assetId: string;
        assetName: string;
        complaintCount: number;
    }>;
    technicianPerformance: Array<{
        technicianId: string;
        technicianName: string;
        completedTasks: number;
        averageTime: number;
        rating: number;
    }>;
    monthlyTrends: Array<{
        month: string;
        complaints: number;
        resolved: number;
    }>;
}

// Notification Types
export interface Notification {
    id: string;
    userId: string;
    type: 'complaint_created' | 'complaint_assigned' | 'status_updated' | 'complaint_resolved' | 'otp_sent';
    title: string;
    message: string;
    read: boolean;
    createdAt: Date;
    relatedComplaintId?: string;
}

// Form Types
export interface ComplaintFormData {
    assetId: string;
    title: string;
    description: string;
    images: File[];
    video?: File;
}

export interface LoginFormData {
    email: string;
    password: string;
    role: UserRole;
}

export interface RegisterFormData extends LoginFormData {
    name: string;
    phone: string;
    department?: string;
}
