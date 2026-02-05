import { useState, useEffect } from 'react';
import { Plus, QrCode, Clock, CheckCircle, AlertCircle, Search, Filter } from 'lucide-react';
import type { Complaint, ComplaintStatus } from '../types';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { formatDate, getTimeDifference, getStatusBadgeStyle, getSeverityBadgeStyle } from '../utils/helpers';
import ComplaintForm from './ComplaintForm';
import ComplaintDetails from './ComplaintDetails';
import QRScanner from './QRScanner';
import NotificationBell from './common/NotificationBell';

interface StudentDashboardProps {
    prefilledAssetId?: string;
    autoOpenForm?: boolean;
}

const StudentDashboard = ({ prefilledAssetId, autoOpenForm }: StudentDashboardProps = {}) => {
    const { user: currentUser } = useAuth();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showComplaintForm, setShowComplaintForm] = useState(autoOpenForm || false);
    const [showQRScanner, setShowQRScanner] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'all'>('all');

    useEffect(() => {
        const fetchComplaints = async () => {
            try {
                const response = await api.get('/complaints/student');
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

    // Filter student's complaints
    const studentComplaints = complaints;

    const filteredComplaints = studentComplaints.filter(complaint => {
        const matchesSearch = complaint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            complaint.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const stats = [
        {
            label: 'Total Complaints',
            value: studentComplaints.length,
            icon: AlertCircle,
            color: 'from-blue-500 to-cyan-500'
        },
        {
            label: 'In Progress',
            value: studentComplaints.filter(c => c.status === 'in_progress' || c.status === 'assigned').length,
            icon: Clock,
            color: 'from-orange-500 to-red-500'
        },
        {
            label: 'Resolved',
            value: studentComplaints.filter(c => c.status === 'resolved' || c.status === 'closed').length,
            icon: CheckCircle,
            color: 'from-green-500 to-emerald-500'
        }
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center">
                <div className="text-white text-2xl font-bold animate-pulse">Loading Complaints...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">Student Dashboard</h1>
                            <p className="text-white/80">Welcome back, {currentUser.name}!</p>
                        </div>
                        <div className="flex gap-3 items-center">
                            <NotificationBell />
                            <button
                                onClick={() => setShowQRScanner(true)}
                                className="btn-secondary flex items-center gap-2"
                            >
                                <QrCode className="w-5 h-5" />
                                Scan QR Code
                            </button>
                            <button
                                onClick={() => setShowComplaintForm(true)}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                New Complaint
                            </button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid md:grid-cols-3 gap-6">
                        {stats.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <div key={index} className="glass-card-light p-6 card-hover">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                                            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                                        </div>
                                        <div className={`w-14 h-14 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center`}>
                                            <Icon className="w-7 h-7 text-white" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Filters */}
                <div className="glass-card-light p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search complaints..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input-field-light pl-10"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="text-gray-600 w-5 h-5" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as ComplaintStatus | 'all')}
                                className="input-field-light"
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
                        <div className="glass-card-light p-12 text-center">
                            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No complaints found</h3>
                            <p className="text-gray-600 mb-6">Start by scanning a QR code or creating a new complaint</p>
                            <button onClick={() => setShowQRScanner(true)} className="btn-primary">
                                <QrCode className="w-5 h-5 inline mr-2" />
                                Scan QR Code
                            </button>
                        </div>
                    ) : (
                        filteredComplaints.map((complaint) => (
                            <div
                                key={complaint.id}
                                onClick={() => setSelectedComplaint(complaint)}
                                className="glass-card-light p-6 card-hover cursor-pointer"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-semibold text-gray-900">{complaint.title}</h3>
                                            <span className={`status-badge ${getStatusBadgeStyle(complaint.status)} border`}>
                                                {complaint.status.replace('_', ' ').toUpperCase()}
                                            </span>
                                            <span className={`status-badge ${getSeverityBadgeStyle(complaint.severity)} border`}>
                                                {complaint.severity.toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 mb-2">{complaint.description}</p>
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span>ID: {complaint.id}</span>
                                            <span>•</span>
                                            <span>{complaint.asset?.name}</span>
                                            <span>•</span>
                                            <span>{getTimeDifference(complaint.createdAt)}</span>
                                        </div>
                                    </div>
                                    {complaint.images && complaint.images.length > 0 && (
                                        <img
                                            src={typeof complaint.images === 'string' ? JSON.parse(complaint.images)[0] : complaint.images[0]}
                                            alt="Complaint"
                                            className="w-24 h-24 object-cover rounded-lg ml-4"
                                        />
                                    )}
                                </div>

                                {complaint.technician && (
                                    <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                                        <img
                                            src={complaint.technician.avatar}
                                            alt={complaint.technician.name}
                                            className="w-8 h-8 rounded-full"
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                Assigned to: {complaint.technician.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatDate(complaint.assignedAt!)}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modals */}
            {showComplaintForm && (
                <ComplaintForm
                    onClose={() => setShowComplaintForm(false)}
                    prefilledAssetId={prefilledAssetId}
                />
            )}

            {showQRScanner && (
                <QRScanner onClose={() => setShowQRScanner(false)} />
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

export default StudentDashboard;
