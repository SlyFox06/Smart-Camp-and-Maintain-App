import { useState, useEffect } from 'react';
import { Wrench, Clock, CheckCircle, TrendingUp, Search, Filter, X } from 'lucide-react';
import type { Complaint, ComplaintStatus } from '../types';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { getTimeDifference, getStatusBadgeStyle, getSeverityBadgeStyle } from '../utils/helpers';
import ComplaintDetails from './ComplaintDetails';
import NotificationBell from './common/NotificationBell';

const TechnicianDashboard = () => {
    const { user: currentTechnician } = useAuth();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'all'>('all');
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [selectedComplaintForUpdate, setSelectedComplaintForUpdate] = useState<Complaint | null>(null);

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            const response = await api.get('/complaints/technician');
            setComplaints(response.data);
        } catch (error) {
            console.error('Failed to fetch technician tasks', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!currentTechnician) return null;

    const filteredComplaints = complaints.filter(complaint => {
        const matchesSearch = complaint.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            complaint.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const stats = [
        {
            label: 'Assigned Tasks',
            value: complaints.filter(c => ['assigned', 'in_progress'].includes(c.status)).length,
            icon: Wrench,
            color: 'from-orange-500 to-red-500'
        },
        {
            label: 'Completed',
            value: complaints.filter(c => ['resolved', 'closed'].includes(c.status)).length,
            icon: CheckCircle,
            color: 'from-green-500 to-emerald-500'
        },
        {
            label: 'Avg. Time',
            value: `45m`, // Simulated for now
            icon: Clock,
            color: 'from-blue-500 to-cyan-500'
        },
        {
            label: 'Rating',
            value: `4.8/5`, // Simulated for now
            icon: TrendingUp,
            color: 'from-purple-500 to-pink-500'
        }
    ];

    const handleUpdateStatus = (complaint: Complaint) => {
        setSelectedComplaintForUpdate(complaint);
        setShowUpdateModal(true);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-600 via-red-600 to-pink-600 flex items-center justify-center">
                <div className="text-white text-2xl font-bold animate-pulse">Loading Tasks...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-600 via-red-600 to-pink-600 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">Technician Dashboard</h1>
                            <p className="text-white/80">Welcome back, {currentTechnician.name}!</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <NotificationBell />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-4 gap-6">
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

                <div className="glass-card-light p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search tasks..."
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
                                <option value="assigned">Assigned</option>
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {filteredComplaints.length === 0 ? (
                        <div className="glass-card-light p-12 text-center">
                            <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks found</h3>
                            <p className="text-gray-600">You're all caught up! No pending tasks at the moment.</p>
                        </div>
                    ) : (
                        filteredComplaints.map((complaint) => (
                            <div
                                key={complaint.id}
                                className="glass-card-light p-6"
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
                                            <span>{complaint.asset?.building}, {complaint.asset?.room}</span>
                                            <span>•</span>
                                            <span>{getTimeDifference(complaint.createdAt)}</span>
                                        </div>
                                    </div>
                                    {complaint.images && (
                                        <img
                                            src={typeof complaint.images === 'string' ? JSON.parse(complaint.images)[0] : complaint.images[0]}
                                            alt="Complaint"
                                            className="w-24 h-24 object-cover rounded-lg ml-4"
                                        />
                                    )}
                                </div>

                                {complaint.student && (
                                    <div className="flex items-center gap-3 py-3 border-t border-b border-gray-200 my-4">
                                        <img
                                            src={complaint.student.avatar}
                                            alt={complaint.student.name}
                                            className="w-10 h-10 rounded-full"
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                Reported by: {complaint.student.name}
                                            </p>
                                            <p className="text-xs text-gray-500">{complaint.student.email}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setSelectedComplaint(complaint)}
                                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                        View Details
                                    </button>
                                    {complaint.status !== 'resolved' && complaint.status !== 'closed' && (
                                        <button
                                            onClick={() => handleUpdateStatus(complaint)}
                                            className="flex-1 btn-primary"
                                        >
                                            Update Status
                                        </button>
                                    )}
                                    {complaint.status === 'resolved' && (
                                        <div className="flex-1 px-4 py-2 bg-green-100 text-green-800 font-semibold rounded-lg text-center border border-green-300">
                                            OTP: {complaint.otp}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {showUpdateModal && selectedComplaintForUpdate && (
                <UpdateStatusModal
                    complaint={selectedComplaintForUpdate}
                    onClose={() => {
                        setShowUpdateModal(false);
                        setSelectedComplaintForUpdate(null);
                        fetchComplaints();
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

const UpdateStatusModal = ({ complaint, onClose }: { complaint: Complaint; onClose: () => void }) => {
    const [status, setStatus] = useState(complaint.status);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.patch(`/complaints/${complaint.id}/status`, {
                status,
                notes,
                repairEvidence: status === 'resolved' ? 'https://example.com/repair.jpg' : null
            });
            onClose();
        } catch (error) {
            console.error('Failed to update status', error);
            alert('Failed to update status');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card-light max-w-lg w-full">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Update Status</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-6 h-6 text-gray-600" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">New Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as any)}
                            className="input-field-light"
                        >
                            <option value="assigned">Assigned</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes..."
                            className="input-field-light"
                            rows={4}
                        />
                    </div>
                    <div className="flex gap-4">
                        <button type="button" onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="flex-1 btn-primary">
                            {isSubmitting ? 'Updating...' : 'Update Status'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TechnicianDashboard;
