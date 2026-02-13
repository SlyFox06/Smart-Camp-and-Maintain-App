import { useState, useEffect, useRef } from 'react';
import { Wrench, Clock, CheckCircle, TrendingUp, Search, Filter, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import type { Complaint, ComplaintStatus } from '../types';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { getTimeDifference, getStatusBadgeStyle, getSeverityBadgeStyle, isValidImageFile, formatFileSize } from '../utils/helpers';
import ComplaintDetails from './ComplaintDetails';
import NotificationBell from './common/NotificationBell';

const TechnicianDashboard = () => {
    const { user: currentTechnician, updateUser, logout } = useAuth();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'all'>('all');
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [selectedComplaintForUpdate, setSelectedComplaintForUpdate] = useState<Complaint | null>(null);
    const [isAvailable, setIsAvailable] = useState(currentTechnician?.technician?.isAvailable ?? true);
    const [isToggling, setIsToggling] = useState(false);

    useEffect(() => {
        if (currentTechnician?.technician?.isAvailable !== undefined) {
            setIsAvailable(currentTechnician.technician.isAvailable);
        }
    }, [currentTechnician]);

    const handleToggleAvailability = async () => {
        setIsToggling(true);
        try {
            const newStatus = !isAvailable;
            await api.patch('/auth/availability', { isAvailable: newStatus });
            setIsAvailable(newStatus);

            if (currentTechnician && currentTechnician.technician) {
                updateUser({
                    ...currentTechnician,
                    technician: {
                        ...currentTechnician.technician,
                        isAvailable: newStatus
                    }
                });
            }
        } catch (error) {
            console.error('Failed to update availability', error);
            alert('Failed to update status');
        } finally {
            setIsToggling(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            const response = await api.get('/complaints/assigned');
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
            value: complaints.filter(c => ['assigned', 'in_progress', 'rework_required'].includes(c.status)).length,
            icon: Wrench,
            color: 'from-orange-500 to-red-500'
        },
        {
            label: 'Under Review',
            value: complaints.filter(c => c.status === 'work_submitted').length,
            icon: Clock,
            color: 'from-blue-500 to-cyan-500'
        },
        {
            label: 'Completed',
            value: complaints.filter(c => ['resolved', 'closed', 'work_approved'].includes(c.status)).length,
            icon: CheckCircle,
            color: 'from-green-500 to-emerald-500'
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
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-2">Technician Dashboard</h1>
                            <p className="text-gray-600">Welcome back, {currentTechnician.name}!</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleToggleAvailability}
                                disabled={isToggling}
                                className={`px-4 py-2 rounded-full font-semibold flex items-center gap-2 transition-all shadow-sm text-sm border-2 ${isAvailable
                                    ? 'bg-green-100 border-green-200 text-green-700 hover:bg-green-200'
                                    : 'bg-gray-200 border-gray-300 text-gray-600 hover:bg-gray-300'
                                    }`}
                            >
                                <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-600 animate-pulse' : 'bg-gray-500'}`} />
                                {isToggling ? 'Updating...' : isAvailable ? 'Available' : 'Unavailable'}
                            </button>
                            <NotificationBell />
                            <button
                                onClick={logout}
                                className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-colors text-sm font-medium border border-gray-200 shadow-sm"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-4 gap-6">
                        {stats.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
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

                <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-100">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="text-gray-500 w-5 h-5" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as ComplaintStatus | 'all')}
                                className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="all">All Status</option>
                                <option value="assigned">Assigned</option>
                                <option value="in_progress">In Progress</option>
                                <option value="work_submitted">Under Review</option>
                                <option value="work_approved">Work Approved</option>
                                <option value="rework_required">Rework Required</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {filteredComplaints.length === 0 ? (
                        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
                            <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks found</h3>
                            <p className="text-gray-500">You're all caught up! No pending tasks at the moment.</p>
                        </div>
                    ) : (
                        filteredComplaints.map((complaint) => (
                            <div
                                key={complaint.id}
                                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
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

                                        {/* Display Admin Comment if Rework Required */}
                                        {complaint.status === 'rework_required' && complaint.adminComment && (
                                            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                                                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-bold text-red-800">Rework Required:</p>
                                                    <p className="text-sm text-red-700">{complaint.adminComment}</p>
                                                </div>
                                            </div>
                                        )}

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
                                    <div className="flex items-center gap-3 py-3 border-t border-b border-gray-100 my-4">
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
                                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        View Details
                                    </button>
                                    {!['work_submitted', 'resolved', 'closed', 'work_approved'].includes(complaint.status) && (
                                        <button
                                            onClick={() => handleUpdateStatus(complaint)}
                                            className="flex-1 btn-primary"
                                        >
                                            {complaint.status === 'rework_required' ? 'Resubmit Work' : 'Update Status'}
                                        </button>
                                    )}
                                    {['work_submitted', 'work_approved'].includes(complaint.status) && (
                                        <div className="flex-1 px-4 py-2 bg-blue-50 text-blue-700 font-semibold rounded-lg text-center border border-blue-200">
                                            Under Review
                                        </div>
                                    )}
                                    {complaint.status === 'resolved' && (
                                        <div className="flex-1 px-4 py-2 bg-green-100 text-green-800 font-semibold rounded-lg text-center border border-green-200">
                                            Completed
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
    // Determine initial next step based on current status
    const getInitialNextStatus = () => {
        if (complaint.status === 'assigned') return 'in_progress';
        if (complaint.status === 'in_progress' || complaint.status === 'rework_required') return 'work_submitted';
        return 'in_progress';
    };

    const [status, setStatus] = useState<string>(getInitialNextStatus());
    const [notes, setNotes] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && isValidImageFile(file)) {
            setImage(file);
        } else {
            alert('Please select a valid image file');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (status === 'work_submitted') {
                if (!image) {
                    alert('Please upload proof of work');
                    setIsSubmitting(false);
                    return;
                }

                // Convert to Base64
                const reader = new FileReader();
                reader.readAsDataURL(image);
                reader.onload = async () => {
                    const base64API = reader.result as string;

                    try {
                        await api.post(`/complaints/${complaint.id}/work-submit`, {
                            proof: [base64API],
                            note: notes
                        });
                        onClose();
                    } catch (error: any) {
                        console.error('Failed to submit work', error);
                        const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to submit work';
                        alert(`Error: ${errorMessage}`);
                    }
                };
            } else {
                // Regular status update (e.g. assigned -> in_progress)
                await api.patch(`/complaints/${complaint.id}/status`, {
                    status,
                    message: notes
                });
                onClose();
            }
        } catch (error) {
            console.error('Failed to update status', error);
            alert('Failed to update status');
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
                            onChange={(e) => setStatus(e.target.value)}
                            className="input-field-light"
                        >
                            {complaint.status === 'assigned' && <option value="in_progress">In Progress</option>}
                            <option value="work_submitted">Submit Work (Complete)</option>
                        </select>
                    </div>

                    {status === 'work_submitted' && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Work Proof Image <span className="text-red-500">*</span>
                            </label>
                            <input
                                ref={imageInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => imageInputRef.current?.click()}
                                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                            >
                                {image ? (
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={URL.createObjectURL(image)}
                                            alt="Preview"
                                            className="w-16 h-16 object-cover rounded-lg"
                                        />
                                        <div className="text-left">
                                            <p className="text-sm font-medium text-gray-900">{image.name}</p>
                                            <p className="text-xs text-gray-500">{formatFileSize(image.size)}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-600">Click to upload proof</p>
                                    </div>
                                )}
                            </button>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes about the work..."
                            className="input-field-light"
                            rows={4}
                        />
                    </div>
                    <div className="flex gap-4">
                        <button type="button" onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="flex-1 btn-primary">
                            {isSubmitting ? 'Updating...' : (status === 'work_submitted' ? 'Submit Work' : 'Update Status')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TechnicianDashboard;
