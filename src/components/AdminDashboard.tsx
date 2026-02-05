import { useState, useEffect } from 'react';
import { Shield, TrendingUp, Clock, CheckCircle, AlertTriangle, Wrench, BarChart3, Box } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { formatResolutionTime } from '../utils/helpers';
import ComplaintDetails from './ComplaintDetails';
import AssetManagement from './AssetManagement';
import AddTechnicianModal from './AddTechnicianModal';
import NotificationBell from './common/NotificationBell';
import type { Complaint, AnalyticsData } from '../types';

const AdminDashboard = () => {
    const { user: currentAdmin } = useAuth();
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'complaints' | 'technicians' | 'analytics' | 'assets' | 'audit'>('overview');
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await api.get('/complaints/analytics');
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
                        <div className="flex items-center gap-3">
                            <NotificationBell />
                            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white font-semibold flex items-center">
                                <Shield className="w-5 h-5 mr-2" />
                                {currentAdmin.name}
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                </div>

                {/* Tabs */}
                <div className="glass-card-light mb-6">
                    <div className="flex border-b border-gray-200 overflow-x-auto">
                        {[
                            { id: 'overview', label: 'Overview', icon: BarChart3 },
                            { id: 'complaints', label: 'All Complaints', icon: AlertTriangle },
                            { id: 'technicians', label: 'Technicians', icon: Wrench },
                            { id: 'assets', label: 'Assets', icon: Box },
                        ].map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex-1 min-w-[120px] px-6 py-4 font-semibold transition-colors flex items-center justify-center gap-2 ${activeTab === tab.id
                                        ? 'text-purple-600 border-b-2 border-purple-600'
                                        : 'text-gray-600 hover:text-gray-900'
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
                        {activeTab === 'technicians' && <TechniciansTab />}
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
const OverviewTab = ({ analytics }: { analytics: AnalyticsData }) => {
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
};

// Complaints Tab
const ComplaintsTab = ({ onSelectComplaint }: { onSelectComplaint: (complaint: Complaint) => void }) => {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const response = await api.get('/complaints/admin');
                setComplaints(response.data);
            } catch (error) {
                console.error('Failed to fetch all complaints', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAll();
    }, []);

    if (isLoading) return <div>Loading complaints...</div>;

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900">All Complaints ({complaints.length})</h3>
            {complaints.map((complaint) => (
                <div
                    key={complaint.id}
                    onClick={() => onSelectComplaint(complaint)}
                    className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow cursor-pointer"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{complaint.title}</h4>
                            <p className="text-sm text-gray-600 mb-2">{complaint.description}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span>ID: {complaint.id}</span>
                                <span>•</span>
                                <span>{complaint.asset?.name}</span>
                                <span>•</span>
                                <span>By: {complaint.student?.name}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${complaint.status === 'reported' ? 'bg-blue-100 text-blue-800' :
                                complaint.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                                    complaint.status === 'in_progress' ? 'bg-orange-100 text-orange-800' :
                                        complaint.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                            'bg-gray-100 text-gray-800'
                                }`}>
                                {complaint.status.replace('_', ' ').toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Technicians Tab
const TechniciansTab = () => {
    const [showAddModal, setShowAddModal] = useState(false);
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Technician Management</h3>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Wrench className="w-4 h-4" />
                    Register Technician
                </button>
            </div>
            <p className="text-gray-600">Technician list integration in progress...</p>
            {showAddModal && <AddTechnicianModal onClose={() => setShowAddModal(false)} />}
        </div>
    );
};

export default AdminDashboard;
