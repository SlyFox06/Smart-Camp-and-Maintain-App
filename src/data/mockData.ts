import type { Asset, Complaint, User, Technician, AnalyticsData } from '../types';

export interface AuditLog {
    id: string;
    action: string;
    userId: string;
    userName: string;
    details: string;
    timestamp: Date;
}

export const mockAuditLogs: AuditLog[] = [
    {
        id: 'LOG001',
        action: 'SYSTEM_INIT',
        userId: 'SYSTEM',
        userName: 'System',
        details: 'System initialized with mock data',
        timestamp: new Date()
    }
];

export const addAuditLog = (action: string, user: User, details: string) => {
    mockAuditLogs.unshift({
        id: `LOG${Date.now()}`,
        action,
        userId: user.id,
        userName: user.name,
        details,
        timestamp: new Date()
    });
};

// Mock Users
export const mockStudents: any[] = [
    {
        id: 'S001',
        name: 'Rahul Sharma',
        email: 'rahul.sharma@campus.edu',
        phone: '+91 98765 43210',
        role: 'student',
        department: 'Computer Science',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul',
        password: 'password123'
    },
    {
        id: 'S002',
        name: 'Priya Patel',
        email: 'priya.patel@campus.edu',
        phone: '+91 98765 43211',
        role: 'student',
        department: 'Electronics',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
        password: 'password123'
    },
];

export const mockTechnicians: any[] = [
    {
        id: 'T001',
        name: 'Amit Kumar',
        email: 'amit.kumar@campus.edu',
        phone: '+91 98765 43220',
        role: 'technician',
        specialization: ['projector', 'computer', 'ac'],
        assignedBuilding: 'Main Building',
        availability: 'available',
        assignedComplaints: 3,
        completedComplaints: 45,
        averageResolutionTime: 120,
        rating: 4.5,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amit',
        password: 'password123'
    },
    {
        id: 'T002',
        name: 'Suresh Reddy',
        email: 'suresh.reddy@campus.edu',
        phone: '+91 98765 43221',
        role: 'technician',
        specialization: ['light', 'water_cooler', 'other'],
        assignedBuilding: 'Science Block',
        availability: 'busy',
        assignedComplaints: 5,
        completedComplaints: 38,
        averageResolutionTime: 90,
        rating: 4.2,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Suresh',
        password: 'password123'
    },
];

export const addTechnician = (tech: Technician) => {
    mockTechnicians.push(tech);
};

export const mockAdmins: any[] = [
    {
        id: 'A001',
        name: 'Dr. Vijay Singh',
        email: 'vijay.singh@campus.edu',
        phone: '+91 98765 43230',
        role: 'admin',
        department: 'Administration',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vijay',
        password: 'admin'
    },
];

// Mock Assets
export const mockAssets: Asset[] = [
    {
        id: 'AST001',
        name: 'Projector - Room 301',
        type: 'projector',
        location: 'Main Building, 3rd Floor, Room 301',
        building: 'Main Building',
        floor: '3',
        room: '301',
        department: 'Computer Science',
        qrCode: 'QR-AST001',
        status: 'operational',
        installationDate: new Date('2022-01-15'),
        lastMaintenance: new Date('2025-12-01')
    },
    {
        id: 'AST002',
        name: 'AC Unit - Lab 205',
        type: 'ac',
        location: 'Science Block, 2nd Floor, Lab 205',
        building: 'Science Block',
        floor: '2',
        room: '205',
        department: 'Physics',
        qrCode: 'QR-AST002',
        status: 'faulty',
        installationDate: new Date('2021-06-10'),
        lastMaintenance: new Date('2025-11-15')
    },
    {
        id: 'AST003',
        name: 'Computer - Lab 101',
        type: 'computer',
        location: 'IT Block, 1st Floor, Lab 101',
        building: 'IT Block',
        floor: '1',
        room: '101',
        department: 'Computer Science',
        qrCode: 'QR-AST003',
        status: 'operational',
        installationDate: new Date('2023-03-20'),
    },
    {
        id: 'AST004',
        name: 'Water Cooler - Corridor A',
        type: 'water_cooler',
        location: 'Main Building, Ground Floor, Corridor A',
        building: 'Main Building',
        floor: 'Ground',
        room: 'Corridor A',
        department: 'General',
        qrCode: 'QR-AST004',
        status: 'under_maintenance',
        installationDate: new Date('2020-08-05'),
        lastMaintenance: new Date('2026-01-20')
    },
];

export const addAsset = (asset: Asset) => {
    mockAssets.push(asset);
};

// Mock Complaints
export const mockComplaints: Complaint[] = [
    {
        id: 'CMP001',
        assetId: 'AST001',
        asset: mockAssets[0],
        studentId: 'S001',
        student: mockStudents[0],
        technicianId: 'T001',
        technician: mockTechnicians[0],
        title: 'Projector not displaying properly',
        description: 'The projector in Room 301 is showing a blurry image and has color distortion.',
        status: 'in_progress',
        severity: 'medium',
        images: ['https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400'],
        location: {
            latitude: 28.6139,
            longitude: 77.2090,
            address: 'Main Building, 3rd Floor, Room 301'
        },
        otpVerified: false,
        createdAt: new Date('2026-02-01T10:30:00'),
        updatedAt: new Date('2026-02-02T14:20:00'),
        assignedAt: new Date('2026-02-01T11:00:00'),
        statusHistory: [
            {
                status: 'reported',
                timestamp: new Date('2026-02-01T10:30:00'),
                updatedBy: 'S001',
                notes: 'Complaint created'
            },
            {
                status: 'assigned',
                timestamp: new Date('2026-02-01T11:00:00'),
                updatedBy: 'A001',
                notes: 'Assigned to Amit Kumar'
            },
            {
                status: 'in_progress',
                timestamp: new Date('2026-02-02T14:20:00'),
                updatedBy: 'T001',
                notes: 'Started working on the issue'
            }
        ]
    },
    {
        id: 'CMP002',
        assetId: 'AST002',
        asset: mockAssets[1],
        studentId: 'S002',
        student: mockStudents[1],
        title: 'AC not cooling',
        description: 'The AC unit in Lab 205 is running but not providing any cooling.',
        status: 'reported',
        severity: 'high',
        images: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400'],
        location: {
            latitude: 28.6140,
            longitude: 77.2091,
            address: 'Science Block, 2nd Floor, Lab 205'
        },
        otpVerified: false,
        createdAt: new Date('2026-02-03T09:15:00'),
        updatedAt: new Date('2026-02-03T09:15:00'),
        statusHistory: [
            {
                status: 'reported',
                timestamp: new Date('2026-02-03T09:15:00'),
                updatedBy: 'S002',
                notes: 'Complaint created'
            }
        ]
    },
    {
        id: 'CMP003',
        assetId: 'AST003',
        asset: mockAssets[2],
        studentId: 'S001',
        student: mockStudents[0],
        technicianId: 'T001',
        technician: mockTechnicians[0],
        title: 'Computer won\'t boot',
        description: 'Computer #5 in Lab 101 is not starting up. Shows black screen.',
        status: 'resolved',
        severity: 'medium',
        images: ['https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400'],
        location: {
            latitude: 28.6138,
            longitude: 77.2089,
            address: 'IT Block, 1st Floor, Lab 101'
        },
        otp: '4523',
        otpVerified: false,
        createdAt: new Date('2026-01-30T14:00:00'),
        updatedAt: new Date('2026-02-01T16:30:00'),
        assignedAt: new Date('2026-01-30T15:00:00'),
        resolvedAt: new Date('2026-02-01T16:30:00'),
        statusHistory: [
            {
                status: 'reported',
                timestamp: new Date('2026-01-30T14:00:00'),
                updatedBy: 'S001',
                notes: 'Complaint created'
            },
            {
                status: 'assigned',
                timestamp: new Date('2026-01-30T15:00:00'),
                updatedBy: 'A001',
                notes: 'Assigned to Amit Kumar'
            },
            {
                status: 'in_progress',
                timestamp: new Date('2026-01-31T10:00:00'),
                updatedBy: 'T001',
                notes: 'Diagnosing the issue'
            },
            {
                status: 'resolved',
                timestamp: new Date('2026-02-01T16:30:00'),
                updatedBy: 'T001',
                notes: 'Replaced faulty RAM module'
            }
        ]
    },
];

// Mock Analytics Data
export const mockAnalytics: AnalyticsData = {
    totalComplaints: 156,
    activeComplaints: 23,
    resolvedComplaints: 133,
    averageResolutionTime: 105, // minutes
    complaintsByStatus: {
        reported: 8,
        assigned: 7,
        in_progress: 8,
        resolved: 12,
        closed: 121
    },
    complaintsBySeverity: {
        low: 45,
        medium: 67,
        high: 32,
        critical: 12
    },
    complaintsByAssetType: {
        projector: 34,
        ac: 28,
        computer: 45,
        light: 23,
        water_cooler: 18,
        other: 8
    },
    topFailingAssets: [
        { assetId: 'AST003', assetName: 'Computer - Lab 101', complaintCount: 12 },
        { assetId: 'AST001', assetName: 'Projector - Room 301', complaintCount: 9 },
        { assetId: 'AST002', assetName: 'AC Unit - Lab 205', complaintCount: 7 },
    ],
    technicianPerformance: [
        { technicianId: 'T001', technicianName: 'Amit Kumar', completedTasks: 45, averageTime: 120, rating: 4.5 },
        { technicianId: 'T002', technicianName: 'Suresh Reddy', completedTasks: 38, averageTime: 90, rating: 4.2 },
    ],
    monthlyTrends: [
        { month: 'Aug', complaints: 18, resolved: 16 },
        { month: 'Sep', complaints: 22, resolved: 20 },
        { month: 'Oct', complaints: 25, resolved: 23 },
        { month: 'Nov', complaints: 20, resolved: 19 },
        { month: 'Dec', complaints: 28, resolved: 25 },
        { month: 'Jan', complaints: 24, resolved: 22 },
    ]
} as any;

// Current logged-in user (can be changed based on login)
export let currentUser: User = mockStudents[0];

export const setCurrentUser = (user: User) => {
    currentUser = user;
};

// Authentication Helpers
export const authenticateUser = async (email: string, password: string): Promise<User | null> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const allUsers = [...mockStudents, ...mockTechnicians, ...mockAdmins];
    const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && (u as any).password === password);

    if (user) {
        // Return user without password
        const { password, ...safeUser } = user as any;
        return safeUser;
    }
    return null;
};

export const registerMockStudent = async (studentData: Partial<User> & { password: string }): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const newStudent: any = {
        id: `S${Date.now()}`,
        role: 'student',
        ...studentData,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${studentData.name}`
    };

    mockStudents.push(newStudent);

    const { password, ...safeUser } = newStudent;
    return safeUser;
};
