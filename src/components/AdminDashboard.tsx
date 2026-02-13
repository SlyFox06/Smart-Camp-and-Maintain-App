import { useState, useEffect } from 'react';
import { TrendingUp, Clock, CheckCircle, AlertTriangle, Wrench, BarChart3, Box, Search, Users, BookOpen, Sparkles } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { formatResolutionTime } from '../utils/helpers';
import ComplaintDetails from './ComplaintDetails';
import AssetManagement from './AssetManagement';
import ClassroomManagement from './ClassroomManagement';
import CleaningManagement from './CleaningManagement';
import EmergencyManagement from './EmergencyManagement';
import UserManagement from './admin/UserManagement';
import NotificationBell from './common/NotificationBell';
import type { Complaint, AnalyticsData } from '../types';

interface Emergency {
    id: string;
    type: string;
    location: string;
    description: string;
    status: 'triggered' | 'responding' | 'resolved';
    reportedAt: string;
    assignedTo?: {
        id: string;
        name: string;
        email: string;
        role: string;
        technician?: {
            skillType: string;
            isAvailable: boolean;
        }
    };
    assetId?: string;
    escalationLevel?: number;
}

const AdminDashboard = () => {
    const { user: currentAdmin, logout } = useAuth();

    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'complaints' | 'students' | 'technicians' | 'cleaners' | 'assets' | 'classrooms' | 'cleaning' | 'emergency'>('overview');
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Global Search State
    const [globalSearchQuery, setGlobalSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Emergency System
    const [emergencies, setEmergencies] = useState<Emergency[]>([]);
    const [showEmergencyModal, setShowEmergencyModal] = useState(false);

    const fetchEmergencies = async () => {
        try {
            const res = await api.get('/emergency');
            setEmergencies(res.data);
        } catch (e) {
            console.error('Failed to fetch emergencies', e);
        }
    };

    const handleEmergencyAction = async (id: string, customStatus: string) => {
        try {
            await api.patch(`/emergency/${id}/status`, { status: customStatus }); // API expects 'status'
            fetchEmergencies();
        } catch (e) {
            alert('Action failed');
        }
    };

    const handleAssignTechnician = async (emergencyId: string, technicianId: string) => {
        try {
            await api.patch(`/emergency/${emergencyId}/status`, { assignedToId: technicianId });
            fetchEmergencies();
        } catch (e) {
            console.error('Assignment failed', e);
            alert('Failed to assign technician');
        }
    };

    useEffect(() => {
        fetchEmergencies();
        const interval = setInterval(fetchEmergencies, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    // ... rest of component ...


    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await api.get('/admin/analytics');
                setAnalytics(response.data);
            } catch (error) {
                console.error('Failed to fetch analytics', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (globalSearchQuery.trim()) {
                handleGlobalSearch();
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [globalSearchQuery]);

    const handleGlobalSearch = async () => {
        setIsSearching(true);
        try {
            // Implement global search if needed
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setIsSearching(false);
        }
    };

    if (!currentAdmin) return null;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-600 text-xl font-medium flex flex-col items-center gap-4">
                    <div className="loading-spinner border-blue-600/30 border-t-blue-600"></div>
                    Loading Analytics...
                </div>
            </div>
        );
    }

    const stats = [
        { title: 'Total Complaints', value: analytics?.totalComplaints || 0, change: '+12%', trend: 'up', icon: AlertTriangle, color: 'from-[#00D4FF] to-[#00D4FF]' },
        { title: 'Active Complaints', value: analytics?.activeComplaints || 0, change: '-5%', trend: 'up', icon: Clock, color: 'from-[#9D4EDD] to-[#9D4EDD]' },
        { title: 'Resolved', value: analytics?.resolvedComplaints || 0, change: '+18%', trend: 'up', icon: CheckCircle, color: 'from-[#10B981] to-[#10B981]' },
        { title: 'Avg Resolution', value: formatResolutionTime(analytics?.averageResolutionTime || 0), change: '-2h', trend: 'down', icon: TrendingUp, color: 'from-[#EC4899] to-[#EC4899]' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
            <div className="max-w-7xl mx-auto">
                {/* EMERGENCY BANNER */}
                {emergencies.length > 0 && (
                    <div
                        onClick={() => setShowEmergencyModal(true)}
                        className="mb-6 bg-red-600 text-white p-4 rounded-xl shadow-lg border-2 border-red-400 animate-pulse flex items-center justify-between cursor-pointer hover:bg-red-700 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 p-2 rounded-full">
                                <AlertTriangle className="w-8 h-8 animate-bounce" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-wider">Active Emergency ({emergencies.length})</h2>
                                <p className="font-medium text-red-100">
                                    {emergencies.filter(e => e.status === 'triggered').length} Unacknowledged • Click to Respond
                                </p>
                            </div>
                        </div>
                        <button className="bg-white text-red-600 px-6 py-2 rounded-lg font-bold shadow-sm hover:bg-gray-100">
                            OPEN CONSOLE
                        </button>
                    </div>
                )}

                {/* EMERGENCY MODAL */}
                {showEmergencyModal && (
                    <EmergencyConsole
                        emergencies={emergencies}
                        onClose={() => setShowEmergencyModal(false)}
                        onUpdateStatus={handleEmergencyAction}
                        onAssign={handleAssignTechnician}
                    />
                )}

                {/* Header */}
                <div className="mb-8 p-6 rounded-2xl bg-white shadow-sm border border-gray-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-1">Admin Dashboard</h1>
                            <p className="text-gray-500">Monitor complaints, assets, and system performance</p>
                        </div>

                        <div className="flex flex-1 max-w-xl mx-4">
                            <form onSubmit={(e) => e.preventDefault()} className="relative w-full group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search complaints, users, assets..."
                                    value={globalSearchQuery}
                                    onChange={(e) => setGlobalSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-300"
                                />
                            </form>
                        </div>

                        <div className="flex items-center gap-4">
                            <NotificationBell />
                            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div className="hidden md:block text-right">
                                    <p className="font-semibold text-gray-800">{currentAdmin.name}</p>
                                    <p className="text-xs text-gray-500">Administrator</p>
                                </div>
                            </div>



                            <button
                                onClick={logout}
                                className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors font-medium"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex gap-1 border-b border-gray-200 overflow-x-auto pb-1">
                        {[
                            { id: 'overview', label: 'Overview', icon: BarChart3 },
                            { id: 'complaints', label: 'Complaints', icon: AlertTriangle },
                            { id: 'students', label: 'Students', icon: Users },
                            { id: 'technicians', label: 'Technicians', icon: Wrench },
                            { id: 'cleaners', label: 'Cleaners', icon: Users },
                            { id: 'assets', label: 'Assets', icon: Box },
                            { id: 'classrooms', label: 'Classrooms', icon: BookOpen },
                            { id: 'cleaning', label: 'Cleaning', icon: Sparkles },
                            { id: 'emergency', label: 'Emergency', icon: AlertTriangle }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-t-lg transition-all duration-300 text-sm font-medium border-b-[2px] whitespace-nowrap ${activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <tab.icon className={`w-4 h-4`} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {isSearching ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-500">Searching across system...</p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'overview' && (
                            <div className="space-y-8">
                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {stats.map((stat, index) => (
                                        <div
                                            key={index}
                                            className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <p className="text-gray-500 text-sm font-medium mb-1">{stat.title}</p>
                                                    <h3 className="text-3xl font-bold text-gray-800">{stat.value}</h3>
                                                </div>
                                                <div className={`p-3 rounded-lg bg-gray-50 text-gray-600`}>
                                                    <stat.icon className="w-6 h-6" />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className={`font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {stat.change}
                                                </span>
                                                <span className="text-gray-400">vs last period</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Main Content Card for Overview */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                                    <OverviewTab analytics={analytics || {
                                        totalComplaints: 0,
                                        activeComplaints: 0,
                                        resolvedComplaints: 0,
                                        averageResolutionTime: 0,
                                        complaintsByStatus: { reported: 0, assigned: 0, in_progress: 0, work_submitted: 0, work_approved: 0, rework_required: 0, feedback_pending: 0, resolved: 0, closed: 0, rejected: 0 },
                                        complaintsBySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
                                        complaintsByAssetType: {},
                                        topFailingAssets: [],
                                        technicianPerformance: [],
                                        monthlyTrends: []
                                    } as any} />
                                </div>
                            </div>
                        )}
                        {/* Other Tabs Rendering */}
                        <div className="mt-6">
                            {activeTab === 'complaints' && <ComplaintsTab onSelectComplaint={setSelectedComplaint} />}
                            {activeTab === 'students' && <UserManagement role="student" />}
                            {activeTab === 'technicians' && <UserManagement role="technician" />}
                            {activeTab === 'cleaners' && <UserManagement role="cleaner" />}
                            {activeTab === 'assets' && <AssetManagement />}
                            {activeTab === 'classrooms' && <ClassroomManagement />}
                            {activeTab === 'cleaning' && <CleaningManagement />}
                            {activeTab === 'emergency' && <EmergencyManagement />}
                        </div>
                    </>
                )}
            </div>

            {selectedComplaint && (
                <ComplaintDetails
                    complaint={selectedComplaint}
                    onClose={() => setSelectedComplaint(null)}
                />
            )}
        </div>
    );
};

// OverviewTab
function OverviewTab({ analytics }: { analytics: AnalyticsData }) {
    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-xl font-bold text-gray-800 mb-6 pl-2 border-l-4 border-blue-500">Complaints by Status</h3>
                <div className="grid md:grid-cols-5 gap-4">
                    {Object.entries(analytics.complaintsByStatus || {}).map(([status, count]) => (
                        <div key={status} className="bg-white border border-gray-100 rounded-xl p-4 text-center hover:shadow-md transition-all duration-300 group">
                            <p className="text-4xl font-bold text-blue-600 mb-2 group-hover:scale-110 transition-transform">{count}</p>
                            <p className="text-sm text-gray-500 capitalize tracking-wider">{status.replace('_', ' ')}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-xl font-bold text-gray-800 mb-6 pl-2 border-l-4 border-purple-500">Complaints by Severity</h3>
                <div className="grid md:grid-cols-4 gap-4">
                    {Object.entries(analytics.complaintsBySeverity || {}).map(([severity, count]) => {
                        const style = {
                            low: { bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-600' },
                            medium: { bg: 'bg-yellow-50', border: 'border-yellow-100', text: 'text-yellow-600' },
                            high: { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-600' },
                            critical: { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-600' }
                        };
                        const s = style[severity as keyof typeof style] || style.low;

                        return (
                            <div key={severity} className={`rounded-xl p-4 text-center border transition-all duration-300 hover:-translate-y-1 ${s.bg} ${s.border}`}>
                                <p className={`text-4xl font-bold mb-2 ${s.text}`}>{count}</p>
                                <p className={`text-sm font-semibold capitalize tracking-wide text-gray-600`}>{severity}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// Complaints Tab with Search
function ComplaintsTab({ onSelectComplaint }: { onSelectComplaint: (complaint: Complaint) => void }) {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchComplaints();
    }, [searchTerm, statusFilter]);

    const fetchComplaints = async () => {
        setIsLoading(true);
        try {
            const params: any = {};
            if (searchTerm) params.q = searchTerm;
            if (statusFilter !== 'all') params.status = statusFilter;

            const response = await api.get('/admin/complaints/search', { params });
            // Sort by most recent
            const sorted = response.data.sort((a: Complaint, b: Complaint) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setComplaints(sorted);
        } catch (error) {
            console.error('Failed to fetch complaints', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 pl-2 border-l-4 border-blue-500">Manage Complaints</h3>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by ID, Title, Student..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 h-10 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-10 w-40 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-blue-500 transition-all px-3"
                    >
                        <option value="all">All Status</option>
                        <option value="reported">Reported</option>
                        <option value="assigned">Assigned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                    </select>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-12 text-gray-500 italic">Loading complaints data...</div>
            ) : complaints.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    No complaints found matching your filters.
                </div>
            ) : (
                <div className="grid gap-4">
                    {complaints.map((complaint) => (
                        <div
                            key={complaint.id}
                            onClick={() => onSelectComplaint(complaint)}
                            className="bg-white border border-gray-100 rounded-xl p-5 hover:bg-gray-50 hover:border-blue-300 transition-all cursor-pointer shadow-sm hover:shadow-md"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 className="font-semibold text-lg text-gray-800 group-hover:text-blue-600 transition-colors">
                                            {complaint.title}
                                        </h4>
                                        <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded border border-gray-200">#{complaint.id.slice(0, 8)}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-3 line-clamp-1">{complaint.description}</p>
                                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                                        <span className="flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5 text-blue-500" />
                                            {complaint.student?.name}
                                        </span>
                                        <span className="text-gray-300">•</span>
                                        <span className="flex items-center gap-1.5">
                                            <Box className="w-3.5 h-3.5 text-purple-500" />
                                            {complaint.asset?.name}
                                        </span>
                                        {complaint.technician && (
                                            <>
                                                <span className="text-gray-300">•</span>
                                                <span className="flex items-center gap-1.5 text-gray-700 font-medium">
                                                    <Wrench className="w-3.5 h-3.5" />
                                                    {complaint.technician.name}
                                                </span>
                                            </>
                                        )}
                                        <span className="text-gray-300">•</span>
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5 text-green-500" />
                                            {new Date(complaint.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3 items-end pl-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${complaint.status === 'reported' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                        complaint.status === 'assigned' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                                            complaint.status === 'in_progress' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                                complaint.status === 'resolved' ? 'bg-green-50 text-green-600 border-green-200' :
                                                    complaint.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-200' :
                                                        'bg-gray-50 text-gray-600 border-gray-200'
                                        }`}>
                                        {complaint.status.replace('_', ' ')}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${complaint.severity === 'critical' ? 'bg-red-100 text-red-600 border-red-200' :
                                        complaint.severity === 'high' ? 'bg-orange-100 text-orange-600 border-orange-200' :
                                            'bg-blue-100 text-blue-600 border-blue-200'
                                        }`}>
                                        {complaint.severity.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ----------------------------------------------------------------------
// Emergency Console Component
// ----------------------------------------------------------------------

function EmergencyConsole({ emergencies, onClose, onUpdateStatus, onAssign }: {
    emergencies: Emergency[];
    onClose: () => void;
    onUpdateStatus: (id: string, status: string) => void;
    onAssign: (id: string, techId: string) => void;
}) {
    const [technicians, setTechnicians] = useState<any[]>([]);

    useEffect(() => {
        api.get('/admin/users?role=technician').then(res => setTechnicians(res.data));
    }, []);

    // Helper to get location string
    const getLocation = (loc: string) => {
        try {
            if (loc.startsWith('{')) {
                const l = JSON.parse(loc);
                return l.text || `GPS: ${l.latitude}, ${l.longitude}`;
            }
            return loc;
        } catch { return loc; }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 flex items-center justify-between text-white shadow-md">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-white/20 rounded-full animate-pulse">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold tracking-wide">Emergency Response Console</h2>
                            <p className="text-red-100 text-sm">Real-time monitoring & command center</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg font-medium transition-colors">
                        Close Console
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
                    {emergencies.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-20 opacity-50">
                            <CheckCircle className="w-24 h-24 text-green-500 mb-6" />
                            <h3 className="text-2xl font-bold text-gray-800">All Systems Normal</h3>
                            <p className="text-gray-500 text-lg">No active emergency alerts.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {emergencies.map(em => {
                                const isEscalated = (em.escalationLevel || 0) > 0;
                                return (
                                    <div key={em.id} className={`bg-white border-l-8 ${isEscalated ? 'border-purple-600 ring-2 ring-purple-500/20' : 'border-red-500'} rounded-xl shadow-sm p-6 flex flex-col lg:flex-row gap-8 relative overflow-hidden group hover:shadow-lg transition-shadow`}>
                                        {/* Background pattern for escalation */}
                                        {isEscalated && (
                                            <div className="absolute top-0 right-0 p-2 bg-purple-600 text-white text-xs font-bold uppercase tracking-widest rounded-bl-xl shadow-md z-10">
                                                Escalated lvl {em.escalationLevel}
                                            </div>
                                        )}

                                        <div className="flex-1 space-y-4">
                                            {/* Top Row: Type, Timer, Status */}
                                            <div className="flex flex-wrap items-center gap-4">
                                                <span className="bg-red-100 text-red-800 px-4 py-1.5 rounded-full text-sm font-bold uppercase border border-red-200 shadow-sm flex items-center gap-2">
                                                    <AlertTriangle className="w-4 h-4" />
                                                    {em.type}
                                                </span>
                                                <EmergencyTimer startTime={em.reportedAt} />
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${em.status === 'triggered' ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' :
                                                        em.status === 'responding' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                                            'bg-green-50 text-green-600 border-green-200'
                                                    }`}>
                                                    {em.status}
                                                </span>
                                            </div>

                                            {/* Details */}
                                            <div>
                                                <h3 className="text-2xl font-bold text-gray-900 mb-2">{getLocation(em.location)}</h3>
                                                {em.assetId && (
                                                    <div className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded text-xs font-mono text-gray-600 mb-3">
                                                        <Box className="w-3 h-3" />
                                                        ASSET ID: {em.assetId.split('-')[0].toUpperCase()}...
                                                    </div>
                                                )}
                                                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200 italic">
                                                    "{em.description || "No specific details provided."}"
                                                </p>
                                            </div>

                                            {/* Assignment Info */}
                                            <div className="flex items-center gap-4 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                                    <Wrench className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs text-blue-500 font-bold uppercase tracking-wide">Assigned Responder</p>
                                                    {em.assignedTo ? (
                                                        <p className="font-semibold text-gray-800">{em.assignedTo.name}
                                                            <span className="text-gray-400 font-normal ml-2 text-sm">({em.assignedTo.technician?.skillType || em.assignedTo.role})</span>
                                                        </p>
                                                    ) : (
                                                        <p className="text-red-500 font-bold italic">Unassigned - Action Required</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Controls Section */}
                                        <div className="lg:w-72 flex flex-col gap-3 justify-center border-t lg:border-t-0 lg:border-l pt-6 lg:pt-0 lg:pl-8 border-gray-100">
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 text-center lg:text-left">Response Actions</p>

                                            {/* Reassign Dropdown */}
                                            <div className="relative group/assign">
                                                <select
                                                    className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                                                    onChange={(e) => {
                                                        if (e.target.value) onAssign(em.id, e.target.value);
                                                    }}
                                                    value=""
                                                >
                                                    <option value="" disabled>Assign / Reassign Staff...</option>
                                                    {technicians.map(t => (
                                                        <option key={t.id} value={t.id} disabled={!t.technician?.isAvailable}>
                                                            {t.name} {!t.technician?.isAvailable ? '(Busy)' : `(${t.technician?.skillType})`}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▼</div>
                                            </div>

                                            {/* Status Buttons */}
                                            {em.status === 'triggered' && (
                                                <button
                                                    onClick={() => onUpdateStatus(em.id, 'responding')}
                                                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-bold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                                                >
                                                    <Clock className="w-5 h-5" />
                                                    Acknowledge & Respond
                                                </button>
                                            )}

                                            {(em.status === 'triggered' || em.status === 'responding') && (
                                                <button
                                                    onClick={() => onUpdateStatus(em.id, 'resolved')}
                                                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                                                >
                                                    <CheckCircle className="w-5 h-5" />
                                                    Mark Resolved
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function EmergencyTimer({ startTime }: { startTime: string }) {
    const [elapsed, setElapsed] = useState('');
    const [isUrgent, setIsUrgent] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            const start = new Date(startTime).getTime();
            const now = new Date().getTime();
            const diff = Math.floor((now - start) / 1000); // seconds

            if (diff > 300) setIsUrgent(true); // > 5 mins

            const mins = Math.floor(diff / 60);
            const secs = diff % 60;
            setElapsed(`${mins}m ${secs}s`);
        }, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    return (
        <span className={`text-sm font-mono font-bold flex items-center gap-2 px-3 py-1 rounded bg-gray-100 ${isUrgent ? 'text-red-600 animate-pulse' : 'text-gray-600'}`}>
            <Clock className="w-4 h-4" />
            {elapsed}
        </span>
    );
}

export default AdminDashboard;
