import { useState, useEffect } from 'react';
import { TrendingUp, Clock, CheckCircle, AlertTriangle, Wrench, BarChart3, Search, Users, BedDouble, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { formatResolutionTime } from '../../utils/helpers';
import ComplaintDetails from '../ComplaintDetails';
// import AssetManagement from '../AssetManagement';
import UserManagement from './UserManagement';
import NotificationBell from '../common/NotificationBell';
import type { Complaint, AnalyticsData } from '../../types';

// Simple Asset Management Placeholder for Hostel (Rooms)
// Or we can reuse AssetManagement if updated. For now, let's keep it simple or omit.

const HostelAdminDashboard = () => {
    const { user: currentAdmin, logout } = useAuth();
    const navigate = useNavigate();
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'complaints' | 'students' | 'technicians'>('overview');
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);



    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                // Fetch analytics scoped to 'hostel'
                const response = await api.get('/admin/analytics', { params: { scope: 'hostel' } });
                setAnalytics(response.data);
            } catch (error) {
                console.error('Failed to fetch analytics', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (!currentAdmin) return null;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-600 text-xl font-medium flex flex-col items-center gap-4">
                    <div className="loading-spinner border-orange-600/30 border-t-orange-600"></div>
                    Loading Hostel Data...
                </div>
            </div>
        );
    }

    const stats = [
        { title: 'Hostel Complaints', value: analytics?.totalComplaints || 0, change: '+5%', trend: 'up', icon: AlertTriangle, color: 'from-orange-400 to-red-500' }, // Different color theme
        { title: 'Active Issues', value: analytics?.activeComplaints || 0, change: '-2%', trend: 'down', icon: Clock, color: 'from-yellow-400 to-orange-500' },
        { title: 'Resolved', value: analytics?.resolvedComplaints || 0, change: '+10%', trend: 'up', icon: CheckCircle, color: 'from-green-400 to-emerald-500' },
        { title: 'Avg Time', value: formatResolutionTime(analytics?.averageResolutionTime || 0), change: '-1h', trend: 'down', icon: TrendingUp, color: 'from-blue-400 to-indigo-500' }
    ];

    return (
        <div className="min-h-screen bg-orange-50/30 p-6 font-sans text-gray-800">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 p-6 rounded-2xl bg-white shadow-sm border border-orange-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <h1 className="text-3xl font-bold text-gray-800 mb-1 flex items-center gap-2">
                                    <BedDouble className="w-8 h-8 text-orange-600" />
                                    Hostel Administration
                                </h1>
                            </div>
                            <p className="text-gray-500 ml-12">Manage hostel rooms, complaints, and maintenance</p>
                        </div>

                        <div className="flex flex-1 max-w-xl mx-4">
                            {/* Search could be added here */}
                        </div>

                        <div className="flex items-center gap-4">
                            <NotificationBell />
                            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div className="hidden md:block text-right">
                                    <p className="font-semibold text-gray-800">{currentAdmin.name}</p>
                                    <p className="text-xs text-gray-500">Hostel Admin</p>
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
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-t-lg transition-all duration-300 text-sm font-medium border-b-[2px] whitespace-nowrap ${activeTab === tab.id
                                    ? 'border-orange-500 text-orange-600 bg-orange-50/50'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <tab.icon className={`w-4 h-4`} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {stats.map((stat, index) => (
                                <div
                                    key={index}
                                    className="bg-white rounded-xl p-6 border border-orange-100 shadow-sm hover:shadow-md transition-all duration-300"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <p className="text-gray-500 text-sm font-medium mb-1">{stat.title}</p>
                                            <h3 className="text-3xl font-bold text-gray-800">{stat.value}</h3>
                                        </div>
                                        <div className={`p-3 rounded-lg bg-orange-50 text-orange-600`}>
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
                                complaintsByStatus: {},
                                complaintsBySeverity: {},
                            } as any} />
                        </div>
                    </div>
                )}

                <div className="mt-6">
                    {activeTab === 'complaints' && <ComplaintsTab onSelectComplaint={setSelectedComplaint} />}
                    {activeTab === 'students' && <UserManagement role="student" scope="hostel" />}
                    {activeTab === 'technicians' && <UserManagement role="technician" scope="hostel" />}
                </div>

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
                <h3 className="text-xl font-bold text-gray-800 mb-6 pl-2 border-l-4 border-orange-500">Complaints by Status</h3>
                <div className="grid md:grid-cols-5 gap-4">
                    {Object.entries(analytics.complaintsByStatus || {}).map(([status, count]) => (
                        <div key={status} className="bg-white border border-gray-100 rounded-xl p-4 text-center hover:shadow-md transition-all duration-300 group">
                            <p className="text-4xl font-bold text-orange-600 mb-2 group-hover:scale-110 transition-transform">{count}</p>
                            <p className="text-sm text-gray-500 capitalize tracking-wider">{status.replace('_', ' ')}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-xl font-bold text-gray-800 mb-6 pl-2 border-l-4 border-red-500">Complaints by Severity</h3>
                <div className="grid md:grid-cols-4 gap-4">
                    {Object.entries(analytics.complaintsBySeverity || {}).map(([severity, count]) => (
                        <div key={severity} className="rounded-xl p-4 text-center border border-gray-200 bg-gray-50">
                            <p className="text-4xl font-bold text-gray-800 mb-2">{count}</p>
                            <p className="text-sm font-semibold capitalize tracking-wide text-gray-600">{severity}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Complaints Tab (Scoped to Hostel)
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
            const params: any = { scope: 'hostel' }; // FORCE HOSTEL SCOPE
            if (searchTerm) params.q = searchTerm;
            if (statusFilter !== 'all') params.status = statusFilter;

            const response = await api.get('/admin/complaints/search', { params });
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
                <h3 className="text-xl font-bold text-gray-800 pl-2 border-l-4 border-orange-500">Manage Hostel Complaints</h3>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search complaints..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 h-10 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-10 w-40 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-orange-500 transition-all px-3"
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
                <div className="text-center py-12 text-gray-500 italic">Loading...</div>
            ) : complaints.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    No hostel complaints found.
                </div>
            ) : (
                <div className="grid gap-4">
                    {complaints.map((complaint) => (
                        <div
                            key={complaint.id}
                            onClick={() => onSelectComplaint(complaint)}
                            className="bg-white border border-gray-100 rounded-xl p-5 hover:bg-orange-50/30 hover:border-orange-200 transition-all cursor-pointer shadow-sm"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 className="font-semibold text-lg text-gray-800">
                                            {complaint.title}
                                        </h4>
                                        <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">#{complaint.id.slice(0, 8)}</span>
                                        {(complaint as any).category && (
                                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                                                {(complaint as any).category}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 mb-3 line-clamp-1">{complaint.description}</p>
                                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                                        <span className="flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5" />
                                            {complaint.student?.name}
                                        </span>
                                        <span className="text-gray-300">•</span>
                                        <span className="flex items-center gap-1.5">
                                            <BedDouble className="w-3.5 h-3.5 text-orange-500" />
                                            {complaint.asset?.name} ({complaint.asset?.building} {complaint.asset?.room})
                                        </span>
                                        <span className="text-gray-300">•</span>
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            {new Date(complaint.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3 items-end pl-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${complaint.status === 'reported' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                        complaint.status === 'resolved' ? 'bg-green-50 text-green-600 border-green-200' :
                                            'bg-gray-50 text-gray-600 border-gray-200'
                                        }`}>
                                        {complaint.status.replace('_', ' ')}
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

export default HostelAdminDashboard;
