import { useState, useEffect } from 'react';
import { Shield, TrendingUp, Clock, CheckCircle, AlertTriangle, Wrench, BarChart3, Box, Search, Users } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { formatResolutionTime } from '../utils/helpers';
import ComplaintDetails from './ComplaintDetails';
import AssetManagement from './AssetManagement';
import UserManagement from './admin/UserManagement';
import AntiGravityAdminTheme from './admin/AntiGravityAdminTheme';
import NotificationBell from './common/NotificationBell';
import type { Complaint, AnalyticsData, User, Asset } from '../types';

const AdminDashboard = () => {
    const { user: currentAdmin, logout } = useAuth();
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
        { title: 'Total Complaints', value: analytics?.totalComplaints || 0, change: '+12%', trend: 'up', icon: AlertTriangle, color: 'from-[#00D4FF] to-[#00D4FF]' },
        { title: 'Active Complaints', value: analytics?.activeComplaints || 0, change: '-5%', trend: 'up', icon: Clock, color: 'from-[#9D4EDD] to-[#9D4EDD]' },
        { title: 'Resolved', value: analytics?.resolvedComplaints || 0, change: '+18%', trend: 'up', icon: CheckCircle, color: 'from-[#10B981] to-[#10B981]' },
        { title: 'Avg Resolution', value: formatResolutionTime(analytics?.averageResolutionTime || 0), change: '-2h', trend: 'down', icon: TrendingUp, color: 'from-[#EC4899] to-[#EC4899]' }
    ];



    return (
        <div className="min-h-screen relative p-6 bg-[linear-gradient(135deg,#000000_0%,#0A0E27_50%,#1A0B2E_100%)] overflow-hidden font-sans text-slate-200">
            <AntiGravityAdminTheme />
            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="mb-8 p-6 rounded-2xl bg-[#0a0e27]/95 shadow-[0_4px_20px_rgba(0,212,255,0.3),0_0_40px_rgba(59,130,246,0.15)] border border-[#00d4ff]/30 backdrop-blur-md">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative">
                        <div>
                            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00D4FF] neon-text mb-2 drop-shadow-[0_0_10px_rgba(0,212,255,0.5)]">Admin Dashboard</h1>
                            <p className="text-cyan-200/80 font-light tracking-wide">Monitor complaints, assets, and system performance</p>
                        </div>

                        <div className="flex flex-1 max-w-xl mx-4">
                            <form onSubmit={(e) => e.preventDefault()} className="relative w-full group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00D4FF] w-5 h-5 group-hover:drop-shadow-[0_0_5px_rgba(0,212,255,1)] transition-all" />
                                <input
                                    type="text"
                                    placeholder="Search complaints, users, assets..."
                                    value={globalSearchQuery}
                                    onChange={(e) => setGlobalSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-[#0a0e27]/90 border border-[#00d4ff]/40 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-[#00D4FF] focus:shadow-[0_0_20px_rgba(0,212,255,0.2)] transition-all duration-300"
                                />
                            </form>
                        </div>

                        <div className="flex items-center gap-4">
                            <NotificationBell />
                            <div className="flex items-center gap-3 pl-4 border-l border-[#00d4ff]/20">
                                <div className="w-10 h-10 rounded-full bg-[#0a0e27]/90 border border-[#00d4ff]/40 shadow-[0_0_15px_rgba(0,212,255,0.2)] flex items-center justify-center text-[#00D4FF]">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div className="hidden md:block text-right">
                                    <p className="font-semibold text-white drop-shadow-sm">{currentAdmin.name}</p>
                                    <p className="text-xs text-[#00D4FF]/80">Administrator</p>
                                </div>
                            </div>
                            <button
                                onClick={logout}
                                className="px-4 py-2 bg-gradient-to-br from-[#00D4FF] to-[#3B82F6] text-white rounded-xl shadow-[0_6px_20px_rgba(0,212,255,0.5),0_0_30px_rgba(0,212,255,0.3)] hover:brightness-110 hover:scale-105 transition-all font-bold tracking-wide"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex gap-1 border-b border-[#00d4ff]/20 overflow-x-auto pb-1">
                        {[
                            { id: 'overview', label: 'Overview', icon: BarChart3 },
                            { id: 'complaints', label: 'Complaints', icon: AlertTriangle },
                            { id: 'students', label: 'Students', icon: Users },
                            { id: 'technicians', label: 'Technicians', icon: Wrench },
                            { id: 'assets', label: 'Assets', icon: Box }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-t-lg transition-all duration-300 text-sm font-medium border-b-[3px] whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-[#00d4ff]/10 text-[#00D4FF] border-[#00D4FF] shadow-[0_0_20px_rgba(0,212,255,0.2)]'
                                    : 'text-slate-400 border-transparent hover:text-[#00D4FF] hover:bg-[#00d4ff]/5'
                                    }`}
                            >
                                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'animate-pulse' : ''}`} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {isSearching ? (
                    <div className="bg-[#0a0e27]/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-[#00d4ff]/30 p-8 text-center animate-fade-in-up">
                        <div className="animate-spin w-8 h-8 border-4 border-[#00D4FF] border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-cyan-200">Searching across system...</p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'overview' && (
                            <div className="space-y-8 animate-fade-in-up">
                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {stats.map((stat, index) => (
                                        <div
                                            key={index}
                                            className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/90 rounded-2xl p-6 border border-[#00d4ff]/30 shadow-[0_8px_32px_rgba(0,212,255,0.2),0_0_40px_rgba(59,130,246,0.15)] hover:-translate-y-2 hover:shadow-[0_15px_40px_rgba(0,212,255,0.3)] transition-all duration-500 group overflow-hidden"
                                            style={{ animation: `float ${6 + index}s ease-in-out infinite` }}
                                        >
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00d4ff]/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-[#00d4ff]/20 transition-all duration-500"></div>

                                            <div className="flex items-start justify-between relative z-10">
                                                <div>
                                                    <p className="text-slate-400 text-sm font-medium mb-1 tracking-wider uppercase">{stat.title}</p>
                                                    <h3 className="text-3xl font-bold text-white mb-2 drop-shadow-md">{stat.value}</h3>
                                                    <div className="flex items-center gap-1 text-sm bg-black/20 w-fit px-2 py-1 rounded-lg backdrop-blur-sm">
                                                        <span className={stat.trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}>
                                                            {stat.change}
                                                        </span>
                                                        <span className="text-slate-500">vs last period</span>
                                                    </div>
                                                </div>
                                                <div className={`p-4 rounded-xl backdrop-blur-md border border-white/10 shadow-inner bg-gradient-to-br ${stat.color} opacity-90 group-hover:scale-110 transition-transform duration-300`}>
                                                    <stat.icon className="w-6 h-6 text-white" />
                                                </div>
                                            </div>
                                            <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-transparent via-[#00d4ff] to-transparent w-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                        </div>
                                    ))}
                                </div>

                                {/* Main Content Card for Overview */}
                                <div className="bg-[linear-gradient(135deg,rgba(26,11,46,0.7)_0%,rgba(10,14,39,0.9)_100%)] rounded-2xl shadow-[0_12px_48px_rgba(0,0,0,0.6),0_0_60px_rgba(59,130,246,0.15)] border border-[#00d4ff]/25 backdrop-blur-xl p-8 overflow-hidden relative">
                                    <div className="absolute top-0 right-0 p-32 bg-[#00d4ff]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                                    <OverviewTab analytics={analytics || { totalComplaints: 0, activeComplaints: 0, resolvedComplaints: 0, averageResolutionTime: 0, complaintsByStatus: {}, complaintsBySeverity: {}, recentActivity: [] }} />
                                </div>
                            </div>
                        )}
                        {/* Other Tabs Rendering */}
                        <div className="mt-6">
                            {activeTab === 'complaints' && <ComplaintsTab onSelectComplaint={setSelectedComplaint} />}
                            {activeTab === 'students' && <UserManagement role="student" />}
                            {activeTab === 'technicians' && <UserManagement role="technician" />}
                            {activeTab === 'assets' && <AssetManagement />}
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

// Overview Tab
function OverviewTab({ analytics }: { analytics: AnalyticsData }) {
    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-xl font-bold text-white neon-text mb-6 pl-2 border-l-4 border-cyan-500">Complaints by Status</h3>
                <div className="grid md:grid-cols-5 gap-4">
                    {Object.entries(analytics.complaintsByStatus).map(([status, count]) => (
                        <div key={status} className="floating-card bg-[#0a0e27]/60 backdrop-blur-md border border-cyan-500/30 rounded-xl p-4 text-center group hover:bg-cyan-900/20 transition-all duration-300">
                            <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-blue-500 mb-2 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)] group-hover:scale-110 transition-transform">{count}</p>
                            <p className="text-sm text-cyan-200/70 capitalize tracking-wider">{status.replace('_', ' ')}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-xl font-bold text-white neon-text mb-6 pl-2 border-l-4 border-purple-500">Complaints by Severity</h3>
                <div className="grid md:grid-cols-4 gap-4">
                    {Object.entries(analytics.complaintsBySeverity).map(([severity, count]) => {
                        const style = {
                            low: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', glow: 'shadow-[0_0_15px_rgba(34,197,94,0.2)]' },
                            medium: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', glow: 'shadow-[0_0_15px_rgba(234,179,8,0.2)]' },
                            high: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', glow: 'shadow-[0_0_15px_rgba(249,115,22,0.2)]' },
                            critical: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.2)]' }
                        };
                        const s = style[severity as keyof typeof style] || style.low;

                        return (
                            <div key={severity} className={`rounded-xl p-4 text-center backdrop-blur-md border transition-all duration-300 hover:-translate-y-1 ${s.bg} ${s.border} ${s.glow}`}>
                                <p className={`text-4xl font-bold mb-2 ${s.text} drop-shadow-md`}>{count}</p>
                                <p className={`text-sm font-semibold capitalize tracking-wide text-white/80`}>{severity}</p>
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
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white neon-text pl-2 border-l-4 border-cyan-500">Manage Complaints</h3>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by ID, Title, Student..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 h-10 bg-[#0a0e27]/60 border border-cyan-500/30 rounded-lg text-white placeholder-cyan-200/30 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(34,211,238,0.2)] transition-all"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-10 w-40 bg-[#0a0e27]/60 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 transition-all px-3"
                    >
                        <option value="all" className="bg-[#0a0e27] text-white">All Status</option>
                        <option value="reported" className="bg-[#0a0e27] text-white">Reported</option>
                        <option value="assigned" className="bg-[#0a0e27] text-white">Assigned</option>
                        <option value="in_progress" className="bg-[#0a0e27] text-white">In Progress</option>
                        <option value="resolved" className="bg-[#0a0e27] text-white">Resolved</option>
                        <option value="closed" className="bg-[#0a0e27] text-white">Closed</option>
                    </select>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-12 text-cyan-200/50 italic animate-pulse">Loading complaints data...</div>
            ) : complaints.length === 0 ? (
                <div className="text-center py-12 text-cyan-200/50 bg-[#0a0e27]/40 rounded-xl border border-dashed border-cyan-500/20 backdrop-blur-sm">
                    No complaints found matching your filters.
                </div>
            ) : (
                <div className="grid gap-4">
                    {complaints.map((complaint) => (
                        <div
                            key={complaint.id}
                            onClick={() => onSelectComplaint(complaint)}
                            className="group relative bg-[#0a0e27]/40 backdrop-blur-md border border-cyan-500/20 rounded-xl p-5 hover:bg-cyan-900/10 hover:border-cyan-500/40 transition-all cursor-pointer overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex items-start justify-between relative z-10">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 className="font-semibold text-lg text-white group-hover:text-cyan-400 transition-colors shadow-black drop-shadow-sm">
                                            {complaint.title}
                                        </h4>
                                        <span className="text-xs text-cyan-200/40 font-mono bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-500/10">#{complaint.id.slice(0, 8)}</span>
                                    </div>
                                    <p className="text-sm text-cyan-100/70 mb-3 line-clamp-1">{complaint.description}</p>
                                    <div className="flex flex-wrap items-center gap-4 text-xs text-cyan-200/60">
                                        <span className="flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5 text-blue-400" />
                                            {complaint.student?.name}
                                        </span>
                                        <span className="text-cyan-500/20">•</span>
                                        <span className="flex items-center gap-1.5">
                                            <Box className="w-3.5 h-3.5 text-purple-400" />
                                            {complaint.asset?.name}
                                        </span>
                                        {complaint.technician && (
                                            <>
                                                <span className="text-cyan-500/20">•</span>
                                                <span className="flex items-center gap-1.5 text-cyan-400 font-medium">
                                                    <Wrench className="w-3.5 h-3.5" />
                                                    {complaint.technician.name}
                                                </span>
                                            </>
                                        )}
                                        <span className="text-cyan-500/20">•</span>
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5 text-green-400" />
                                            {new Date(complaint.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3 items-end pl-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border backdrop-blur-sm ${complaint.status === 'reported' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]' :
                                        complaint.status === 'assigned' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]' :
                                            complaint.status === 'in_progress' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.2)]' :
                                                complaint.status === 'resolved' ? 'bg-green-500/10 text-green-400 border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]' :
                                                    complaint.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]' :
                                                        'bg-gray-500/10 text-gray-400 border-gray-500/30'
                                        }`}>
                                        {complaint.status.replace('_', ' ')}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${complaint.severity === 'critical' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                        complaint.severity === 'high' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                                            'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
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

export default AdminDashboard;
