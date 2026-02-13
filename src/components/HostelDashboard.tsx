import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, QrCode, Clock, CheckCircle, AlertCircle, Search, Filter, Home, LogOut } from 'lucide-react';
import type { Complaint, ComplaintStatus } from '../types';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { getTimeDifference, getStatusBadgeStyle, getSeverityBadgeStyle } from '../utils/helpers';
import ComplaintForm from './ComplaintForm';
import ComplaintDetails from './ComplaintDetails';
import QRScanner from './QRScanner';
import NotificationBell from './common/NotificationBell';

interface HostelDashboardProps {
    prefilledAssetId?: string;
    autoOpenForm?: boolean;
}

const HostelDashboard = ({ prefilledAssetId, autoOpenForm }: HostelDashboardProps = {}) => {
    const { user: currentUser, logout } = useAuth();
    const [searchParams] = useSearchParams();
    const urlAssetId = searchParams.get('assetId'); // Get assetId from URL if exists

    // Prioritize prop, then URL param
    const effectiveAssetId = prefilledAssetId || urlAssetId || '';

    // State management
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showComplaintForm, setShowComplaintForm] = useState(autoOpenForm || !!urlAssetId);
    const [showQRScanner, setShowQRScanner] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'all'>('all');
    const [scannedAssetId, setScannedAssetId] = useState<string>('');

    useEffect(() => {
        const fetchComplaints = async () => {
            try {
                // Fetch only hostel complaints
                const response = await api.get('/complaints/my-complaints', { params: { scope: 'hostel' } });
                setComplaints(response.data);
            } catch (error) {
                console.error('Failed to fetch complaints', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchComplaints();
    }, []);

    if (!currentUser) return null;

    const filteredComplaints = complaints.filter(complaint => {
        const matchesSearch = complaint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            complaint.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const stats = [
        {
            label: 'Hostel Complaints',
            value: complaints.length,
            icon: AlertCircle,
            color: 'from-orange-500 to-amber-500' // Distinct color for Hostel
        },
        {
            label: 'In Progress',
            value: complaints.filter(c => c.status === 'in_progress' || c.status === 'assigned').length,
            icon: Clock,
            color: 'from-blue-500 to-cyan-500'
        },
        {
            label: 'Resolved',
            value: complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length,
            icon: CheckCircle,
            color: 'from-green-500 to-emerald-500'
        }
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-600 flex items-center justify-center">
                <div className="text-white text-2xl font-bold animate-pulse">Loading Hostel Dashboard...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-orange-50 p-4 md:p-6 text-gray-900">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                        <div className="text-center md:text-left">
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-2 justify-center md:justify-start">
                                <Home className="w-8 h-8 text-orange-600" />
                                Hostel Dashboard
                            </h1>
                            <p className="text-gray-600">Welcome back to your hostel portal, {currentUser.name}!</p>
                        </div>
                        <div className="flex flex-wrap gap-3 items-center justify-center w-full md:w-auto">
                            <NotificationBell />
                            <button
                                onClick={() => setShowQRScanner(true)}
                                className="bg-white hover:bg-orange-50 text-orange-700 border border-orange-200 rounded-lg px-4 py-2 flex items-center gap-2 transition-all shadow-sm"
                            >
                                <QrCode className="w-5 h-5" />
                                Scan Asset
                            </button>
                            <button
                                onClick={() => setShowComplaintForm(true)}
                                className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg px-4 py-2 flex items-center gap-2 transition-all shadow-md"
                            >
                                <Plus className="w-5 h-5" />
                                Report Issue
                            </button>
                            <button
                                onClick={logout}
                                className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-colors font-medium border border-gray-200 shadow-sm"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                            {currentUser.accessScope === 'both' && (
                                <button
                                    onClick={() => window.location.href = '/student'}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
                                >
                                    Go to College
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid md:grid-cols-3 gap-6">
                        {stats.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-orange-100 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-gray-500 text-sm mb-1">{stat.label}</p>
                                            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                                        </div>
                                        <div className={`w-14 h-14 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center shadow-sm`}>
                                            <Icon className="w-7 h-7 text-white" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-orange-100">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search complaints..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="text-gray-500 w-5 h-5" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as ComplaintStatus | 'all')}
                                className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
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
                </div>

                {/* Complaints List */}
                <div className="space-y-4">
                    {filteredComplaints.length === 0 ? (
                        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-orange-100">
                            <Home className="w-16 h-16 text-orange-200 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No hostel complaints found</h3>
                            <p className="text-gray-500 mb-6">Everything looks good! Or report an issue if you seek one.</p>
                            <button onClick={() => setShowComplaintForm(true)} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 shadow-sm">
                                <Plus className="w-5 h-5" />
                                Report Issue
                            </button>
                        </div>
                    ) : (
                        filteredComplaints.map((complaint) => (
                            <div
                                key={complaint.id}
                                onClick={() => setSelectedComplaint(complaint)}
                                className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-orange-100 hover:shadow-md transition-shadow cursor-pointer"
                            >
                                <div className="flex flex-col md:flex-row items-start justify-between mb-4 gap-4">
                                    <div className="flex-1 w-full">
                                        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                                            <h3 className="text-lg md:text-xl font-semibold text-gray-900 truncate max-w-[200px] md:max-w-none">{complaint.title}</h3>
                                            <div className="flex gap-2">
                                                <span className={`status-badge ${getStatusBadgeStyle(complaint.status)} border text-xs md:text-sm`}>
                                                    {complaint.status.replace('_', ' ').toUpperCase()}
                                                </span>
                                                <span className={`status-badge ${getSeverityBadgeStyle(complaint.severity)} border text-xs md:text-sm`}>
                                                    {complaint.severity.toUpperCase()}
                                                </span>
                                            </div>
                                            {/* Display Category if exists */}
                                            {(complaint as any).category && (
                                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold ml-1">
                                                    {(complaint as any).category}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-600 mb-2">{complaint.description}</p>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span>ID: {complaint.id.slice(0, 8)}</span>
                                            <span>•</span>
                                            <span>{complaint.asset?.name}</span>
                                            <span>•</span>
                                            <span>{getTimeDifference(complaint.createdAt)}</span>
                                        </div>
                                    </div>
                                    {/* Image Logic */}
                                    {(() => {
                                        const raw = complaint.images as any;
                                        let imgUrl = null;
                                        if (Array.isArray(raw) && raw.length > 0) imgUrl = raw[0];
                                        else if (typeof raw === 'string') {
                                            try {
                                                const parsed = JSON.parse(raw);
                                                if (Array.isArray(parsed) && parsed.length > 0) imgUrl = parsed[0];
                                                else if (raw.length > 0 && !raw.startsWith('[')) imgUrl = raw;
                                            } catch {
                                                if (raw.length > 0) imgUrl = raw;
                                            }
                                        }

                                        if (imgUrl) {
                                            return (
                                                <img
                                                    src={imgUrl}
                                                    alt="Complaint"
                                                    className="w-full h-48 md:w-24 md:h-24 object-cover rounded-lg md:ml-4 order-first md:order-last mb-4 md:mb-0"
                                                />
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modals */}
            {showComplaintForm && (
                <ComplaintForm
                    onClose={() => {
                        setShowComplaintForm(false);
                        setScannedAssetId('');
                    }}
                    prefilledAssetId={scannedAssetId || effectiveAssetId}
                    scope="hostel"
                />
            )}

            {showQRScanner && (
                <QRScanner
                    onClose={() => setShowQRScanner(false)}
                    onScan={(id) => {
                        setScannedAssetId(id);
                        setShowComplaintForm(true);
                        // Optionally update URL to reflect state without reloading?
                        // window.history.replaceState({}, '', `/hostel-student?assetId=${id}`);
                    }}
                />
            )}

            {selectedComplaint && (
                <ComplaintDetails
                    complaint={selectedComplaint}
                    onClose={() => setSelectedComplaint(null)}
                />
            )}
        </div>
    );
};
export default HostelDashboard;
