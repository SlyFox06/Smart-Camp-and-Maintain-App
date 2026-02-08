import { useState, useEffect } from 'react';
import { Shield, TrendingUp, Clock, CheckCircle, AlertTriangle, Wrench, BarChart3, Box, Search, Users } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { formatResolutionTime } from '../utils/helpers';
import ComplaintDetails from './ComplaintDetails';
import AssetManagement from './AssetManagement';
import AddTechnicianModal from './AddTechnicianModal';
import UserManagement from './admin/UserManagement';
import NotificationBell from './common/NotificationBell';
import type { Complaint, AnalyticsData, User, Asset } from '../types';

const AdminDashboard = () => {
    const { user: currentAdmin } = useAuth();
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'complaints' | 'students' | 'technicians' | 'assets'>('overview');
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Global Search State
    const [globalSearchQuery, setGlobalSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{ users: User[], complaints: Complaint[], assets: Asset[] } | null>(null);
    const [isSearching, setIsSearching] = useState(false);

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
            } else {
                setSearchResults(null);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [globalSearchQuery]);

    const handleGlobalSearch = async () => {
        setIsSearching(true);
        try {
            const response = await api.get('/admin/search', { params: { q: globalSearchQuery } });
            setSearchResults(response.data);
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setIsSearching(false);
        }
    };

    if (!currentAdmin) return null;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 flex items-center justify-center">
                <div className="text-white text-2xl font-bold animate-pulse">Loading Analytics...</div>
            </div>
        );
    }

    const stats = [
        {
            label: 'Total Complaints',
            value: analytics?.totalComplaints || 0,
            change: '+12%',
            icon: AlertTriangle,
            color: 'from-blue-500 to-cyan-500'
        },
        {
            label: 'Active Complaints',
            value: analytics?.activeComplaints || 0,
            change: '-5%',
            icon: Clock,
            color: 'from-orange-500 to-red-500'
        },
        {
            label: 'Resolved',
            value: analytics?.resolvedComplaints || 0,
            change: '+18%',
            icon: CheckCircle,
            color: 'from-green-500 to-emerald-500'
        },
        {
            label: 'Avg. Resolution',
            value: formatResolutionTime(analytics?.averageResolutionTime || 0),
            change: '-8%',
            icon: TrendingUp,
            color: 'from-purple-500 to-pink-500'
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
                            <p className="text-white/80">System Overview & Analytics</p>
                        </div>

                        <div className="flex flex-1 max-w-xl mx-4">
                            <form onSubmit={(e) => e.preventDefault()} className="relative w-full">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search complaints, users, assets..."
                                    value={globalSearchQuery}
                                    onChange={(e) => setGlobalSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white/90 backdrop-blur rounded-xl shadow-lg focus:ring-2 focus:ring-white outline-none text-gray-800"
                                />
                                {searchResults && (
                                    <button
                                        type="button"
                                        onClick={() => { setSearchResults(null); setGlobalSearchQuery(''); }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        Clear
                                    </button>
                                )}
                            </form>
                        </div>

                        <div className="flex items-center gap-3">
                            <NotificationBell />
                            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white font-semibold flex items-center">
                                <Shield className="w-5 h-5 mr-2" />
                                {currentAdmin.name}
                            </div>
                        </div>
                    </div>

                    {/* Global Search Results Overlay */}
                    {searchResults && (
                        <div className="mt-6 bg-white rounded-xl shadow-xl p-6 border border-gray-200 animate-in fade-in slide-in-from-top-2 relative z-50">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Search className="w-5 h-5" />
                                Search Results for "{globalSearchQuery}"
                            </h3>

                            <div className="grid md:grid-cols-3 gap-6">
                                <div>
                                    <h4 className="font-semibold text-gray-500 mb-2 uppercase text-xs">Users</h4>
                                    {searchResults.users.length === 0 ? <p className="text-gray-400 text-sm">No users found</p> : (
                                        <ul className="space-y-2">
                                            {searchResults.users.map(u => (
                                                <li key={u.id} className="p-2 hover:bg-gray-50 rounded flex justify-between items-center bg-gray-50/50">
                                                    <div>
                                                        <p className="font-medium text-sm">{u.name}</p>
                                                        <p className="text-xs text-gray-500">{u.role}</p>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-500 mb-2 uppercase text-xs">Complaints</h4>
                                    {searchResults.complaints.length === 0 ? <p className="text-gray-400 text-sm">No complaints found</p> : (
                                        <ul className="space-y-2">
                                            {searchResults.complaints.map(c => (
                                                <li key={c.id} onClick={() => setSelectedComplaint(c)} className="p-2 hover:bg-gray-50 rounded cursor-pointer bg-gray-50/50 group">
                                                    <p className="font-medium text-sm group-hover:text-purple-600 transition-colors">{c.title}</p>
                                                    <p className="text-xs text-gray-500 truncate">{c.description}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-500 mb-2 uppercase text-xs">Assets</h4>
                                    {searchResults.assets.length === 0 ? <p className="text-gray-400 text-sm">No assets found</p> : (
                                        <ul className="space-y-2">
                                            {searchResults.assets.map(a => (
                                                <li key={a.id} className="p-2 hover:bg-gray-50 rounded bg-gray-50/50">
                                                    <p className="font-medium text-sm">{a.name}</p>
                                                    <p className="text-xs text-gray-500">{a.building} - {a.room}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <div key={index} className="glass-card-light p-6 card-hover">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <span className={`text-sm font-semibold ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {stat.change}
                                    </span>
                                </div>
                                <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Tabs */}
                <div className="glass-card-light mb-6">
                    <div className="flex border-b border-gray-200 overflow-x-auto">
                        {[
                            { id: 'overview', label: 'Overview', icon: BarChart3 },
                            { id: 'complaints', label: 'Complaints', icon: AlertTriangle },
                            { id: 'students', label: 'Students', icon: Users },
                            { id: 'technicians', label: 'Technicians', icon: Wrench },
                            { id: 'assets', label: 'Assets', icon: Box },
                        ].map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex-1 min-w-[120px] px-6 py-4 font-semibold transition-colors flex items-center justify-center gap-2 ${activeTab === tab.id
                                        ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="p-6">
                        {activeTab === 'overview' && analytics && <OverviewTab analytics={analytics} />}
                        {activeTab === 'complaints' && <ComplaintsTab onSelectComplaint={setSelectedComplaint} />}
                        {activeTab === 'students' && <UserManagement role="student" />}
                        {activeTab === 'technicians' && (
                            <div>
                                <div className="flex justify-end mb-4">
                                    <TechTabHeader />
                                </div>
                                <UserManagement role="technician" />
                            </div>
                        )}
                        {activeTab === 'assets' && <AssetManagement />}
                    </div>
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

// Overview Tab
function OverviewTab({ analytics }: { analytics: AnalyticsData }) {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Complaints by Status</h3>
                <div className="grid md:grid-cols-5 gap-4">
                    {Object.entries(analytics.complaintsByStatus).map(([status, count]) => (
                        <div key={status} className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4 text-center">
                            <p className="text-3xl font-bold text-gray-900 mb-1">{count}</p>
                            <p className="text-sm text-gray-600 capitalize">{status.replace('_', ' ')}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Complaints by Severity</h3>
                <div className="grid md:grid-cols-4 gap-4">
                    {Object.entries(analytics.complaintsBySeverity).map(([severity, count]) => {
                        const colors = {
                            low: 'from-green-50 to-green-100 border-green-200 text-green-800',
                            medium: 'from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-800',
                            high: 'from-red-50 to-red-100 border-red-200 text-red-800',
                            critical: 'from-red-50 to-red-100 border-red-200 text-red-800'
                        };
                        return (
                            <div key={severity} className={`bg-gradient-to-br border rounded-xl p-4 text-center ${colors[severity as keyof typeof colors]}`}>
                                <p className="text-3xl font-bold mb-1">{count}</p>
                                <p className="text-sm font-semibold capitalize">{severity}</p>
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
            setComplaints(response.data);
        } catch (error) {
            console.error('Failed to fetch complaints', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Manage Complaints</h3>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by ID, Title, Student..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field-light pl-10 h-10"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="input-field-light h-10 w-40"
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
                <div className="text-center py-8 text-gray-500">Loading complaints...</div>
            ) : complaints.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    No complaints found matching your filters.
                </div>
            ) : (
                <div className="grid gap-3">
                    {complaints.map((complaint) => (
                        <div
                            key={complaint.id}
                            onClick={() => onSelectComplaint(complaint)}
                            className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer group"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                                            {complaint.title}
                                        </h4>
                                        <span className="text-xs text-gray-400">#{complaint.id.slice(0, 8)}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2 line-clamp-1">{complaint.description}</p>
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            {complaint.student?.name}
                                        </span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <Box className="w-3 h-3" />
                                            {complaint.asset?.name}
                                        </span>
                                        {complaint.technician && (
                                            <>
                                                <span>•</span>
                                                <span className="flex items-center gap-1 text-purple-600 font-medium">
                                                    <Wrench className="w-3 h-3" />
                                                    {complaint.technician.name}
                                                </span>
                                            </>
                                        )}
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(complaint.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 items-end">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${complaint.status === 'reported' ? 'bg-blue-100 text-blue-800' :
                                        complaint.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                                            complaint.status === 'in_progress' ? 'bg-orange-100 text-orange-800' :
                                                complaint.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                                    complaint.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                        'bg-gray-100 text-gray-800'
                                        }`}>
                                        {complaint.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${complaint.severity === 'critical' ? 'bg-red-50 text-red-600' :
                                        complaint.severity === 'high' ? 'bg-orange-50 text-orange-600' :
                                            'bg-gray-50 text-gray-600'
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

function TechTabHeader() {
    const [showAddModal, setShowAddModal] = useState(false);
    return (
        <>
            <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary flex items-center gap-2"
            >
                <Wrench className="w-4 h-4" />
                Register Technician
            </button>
            {showAddModal && <AddTechnicianModal onClose={() => setShowAddModal(false)} />}
        </>
    );
}

export default AdminDashboard;
