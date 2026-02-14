import { useState, useEffect } from 'react';
import { Sparkles, Calendar, CheckCircle, Clock, AlertCircle, RefreshCw, LogOut, Layout, Camera, X } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from './common/NotificationBell';

interface CleanerProfile {
    id: string;
    assignedArea: string;
    isAvailable: boolean;
    user: {
        name: string;
        email: string;
        phone: string;
        technicianComplaints?: any[]; // Using any[] for simplicity or import Complaint type
    };
    cleaningTasks: CleaningTask[];
}

interface CleaningTask {
    id: string;
    classroomId?: string | null;
    roomId?: string | null;
    scheduledDate: string;
    status: string;
    assignedAt: string | null;
    completedAt: string | null;
    notes: string | null;
    images?: string | null;
    classroom?: {
        name: string;
        building: string;
        floor: string;
        roomNumber: string;
    };
    room?: {
        roomNumber: string;
        block: string;
        floor: string;
        hostelName: string;
    };
}

const CleanerDashboard = () => {
    const { logout } = useAuth();
    const [showProofModal, setShowProofModal] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState('');
    const [taskType, setTaskType] = useState<'routine' | 'complaint'>('routine'); // Track type for proof submission
    const [proofImage, setProofImage] = useState<string>('');
    const [proofNotes, setProofNotes] = useState('');
    const [isSubmittingProof, setIsSubmittingProof] = useState(false);

    const [profile, setProfile] = useState<CleanerProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/cleaners/me');
            setProfile(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load profile');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleAvailability = async () => {
        if (!profile) return;
        setIsUpdating(true);
        try {
            const newAvailability = !profile.isAvailable;
            await api.patch(`/cleaners/${profile.id}/availability`, { isAvailable: newAvailability });
            setProfile({ ...profile, isAvailable: newAvailability });
        } catch (err: any) {
            alert('Failed to update availability');
        } finally {
            setIsUpdating(false);
        }
    };

    const updateTaskStatus = async (taskId: string, status: string, notes?: string, images?: string) => {
        try {
            // Determine endpoint based on taskType
            if (taskType === 'routine') {
                const response = await api.patch(`/cleaning-tasks/${taskId}/status`, {
                    status,
                    notes,
                    images: images ? [images] : undefined
                });
                // Update local state
                if (profile) {
                    const updatedTasks = profile.cleaningTasks.map(t =>
                        t.id === taskId ? {
                            ...t,
                            status: response.data.status,
                            completedAt: response.data.completedAt,
                            notes: response.data.notes,
                            images: response.data.images
                        } : t
                    );
                    setProfile({ ...profile, cleaningTasks: updatedTasks });
                }
            } else {
                // For complaints
                await api.patch(`/complaints/${taskId}/status`, {
                    status: status === 'completed' ? 'work_submitted' : status, // Map completed to work_submitted for complaints
                    workNote: notes,
                    workProof: images ? JSON.stringify([images]) : undefined
                });
                // Refresh profile to get updated complaints list
                fetchProfile();
            }
        } catch (err: any) {
            alert('Failed to update task status');
        }
    };

    const handleMarkDone = (taskId: string, type: 'routine' | 'complaint') => {
        setSelectedTaskId(taskId);
        setTaskType(type);
        setProofImage('');
        setProofNotes('');
        setShowProofModal(true);
    };

    const submitProof = async () => {
        if (!proofImage) {
            alert('Please take/upload a photo of the cleaned area as proof.');
            return;
        }

        setIsSubmittingProof(true);
        try {
            await updateTaskStatus(selectedTaskId, 'completed', proofNotes, proofImage);
            setShowProofModal(false);
            setProofImage('');
            setProofNotes('');
        } catch (err) {
            console.error(err);
            alert('Failed to submit proof and mark task as done.');
        } finally {
            setIsSubmittingProof(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Image is too large. Please use a file smaller than 5MB.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setProofImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'assigned': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'in_progress': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'completed': return 'bg-green-100 text-green-700 border-green-200';
            case 'work_submitted': return 'bg-green-100 text-green-700 border-green-200';
            case 'skipped': return 'bg-red-100 text-red-700 border-red-200';
            case 'waiting_warden_approval': return 'bg-orange-100 text-orange-700 border-orange-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const formatStatus = (status: string) => {
        return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const getLocationDisplay = (task: CleaningTask) => {
        if (task.classroom) {
            return `${task.classroom.name} (${task.classroom.building})`;
        } else if (task.room) {
            return `${task.room.hostelName} - Room ${task.room.roomNumber}`;
        }
        return 'Unknown Location';
    };

    const getLocationDetails = (task: CleaningTask) => {
        if (task.classroom) {
            return `Floor ${task.classroom.floor}`;
        } else if (task.room) {
            return `${task.room.block}, Floor ${task.room.floor}`;
        }
        return '';
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-emerald-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-emerald-600 font-bold">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-600"></div>
                    Loading Dashboard...
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
                    <p className="text-gray-600 mb-6">{error || 'Cleaner profile not found'}</p>
                    <button onClick={fetchProfile} className="btn-primary w-full flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4" /> Try Again
                    </button>
                </div>
            </div>
        );
    }

    const today = new Date().toISOString().split('T')[0];
    const todayTasks = profile.cleaningTasks.filter(t => t.scheduledDate.startsWith(today));
    const assignedComplaints = profile.user.technicianComplaints || [];

    // Combine stats
    const stats = {
        total: todayTasks.length + assignedComplaints.length,
        completed: todayTasks.filter(t => t.status === 'completed').length + assignedComplaints.filter(c => ['resolved', 'work_submitted', 'closed'].includes(c.status)).length,
        pending: todayTasks.filter(t => ['assigned', 'in_progress'].includes(t.status)).length + assignedComplaints.filter(c => ['assigned', 'in_progress', 'waiting_warden_approval'].includes(c.status)).length
    };

    return (
        <div className="min-h-screen bg-emerald-50/50">
            {/* Header */}
            <div className="bg-emerald-600 text-white p-6 pb-20 shadow-lg">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                            <Sparkles className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight uppercase">Cleaner Dashboard</h1>
                            <p className="text-emerald-100 font-medium">Welcome, {profile.user.name} | {profile.assignedArea}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleAvailability}
                            disabled={isUpdating}
                            className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all shadow-md active:scale-95 ${profile.isAvailable
                                ? 'bg-white text-emerald-600'
                                : 'bg-emerald-700 text-emerald-100 border border-emerald-500'
                                }`}
                        >
                            <div className={`w-2 h-2 rounded-full ${profile.isAvailable ? 'bg-emerald-600 animate-pulse' : 'bg-emerald-300'}`} />
                            {isUpdating ? 'Updating...' : profile.isAvailable ? 'Available for Tasks' : 'Unavailable / On Break'}
                        </button>
                        <NotificationBell />
                        <button onClick={logout} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/20">
                            <LogOut className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 -mt-12 space-y-6 pb-12">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-2xl p-6 shadow-md border border-emerald-100 flex items-center justify-between group hover:shadow-xl transition-all">
                        <div>
                            <p className="text-emerald-600 font-bold uppercase text-xs mb-1">Total Tasks Today</p>
                            <p className="text-4xl font-black text-gray-800">{stats.total}</p>
                        </div>
                        <Layout className="w-12 h-12 text-emerald-100 group-hover:text-emerald-200 transition-colors" />
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-md border border-emerald-100 flex items-center justify-between group hover:shadow-xl transition-all">
                        <div>
                            <p className="text-emerald-600 font-bold uppercase text-xs mb-1">Completed</p>
                            <p className="text-4xl font-black text-gray-800">{stats.completed}</p>
                        </div>
                        <CheckCircle className="w-12 h-12 text-emerald-100 group-hover:text-emerald-200 transition-colors" />
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-md border border-emerald-100 flex items-center justify-between group hover:shadow-xl transition-all">
                        <div>
                            <p className="text-emerald-600 font-bold uppercase text-xs mb-1">Pending Assignments</p>
                            <p className="text-4xl font-black text-gray-800">{stats.pending}</p>
                        </div>
                        <Clock className="w-12 h-12 text-emerald-100 group-hover:text-emerald-200 transition-colors" />
                    </div>
                </div>

                {/* Special Requests (Complaints) */}
                {assignedComplaints.length > 0 && (
                    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-orange-100">
                        <div className="p-8 border-b border-orange-50 flex items-center justify-between bg-orange-50/30">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-6 h-6 text-orange-600" />
                                <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Special Requests</h2>
                            </div>
                        </div>
                        <div className="p-4 space-y-4">
                            {assignedComplaints.map(complaint => (
                                <div key={complaint.id} className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg transition-all border-l-8 border-l-orange-500">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-xl font-bold text-gray-800">{complaint.title}</h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase border ${getStatusColor(complaint.status)}`}>
                                                    {formatStatus(complaint.status)}
                                                </span>
                                            </div>
                                            <p className="text-gray-600">{complaint.description}</p>
                                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                                                <span className="flex items-center gap-2">📍 {complaint.asset?.name || complaint.room?.block || complaint.classroom?.name || 'General Area'}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 w-full md:w-auto">
                                            {complaint.status === 'assigned' && (
                                                <button
                                                    onClick={() => updateTaskStatus(complaint.id, 'in_progress', '', '')} // Switch to in_progress
                                                    className="flex-1 md:flex-none px-8 py-3 bg-orange-600 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-orange-700 shadow-md transition-all active:scale-95"
                                                >
                                                    Start Work
                                                </button>
                                            )}
                                            {complaint.status === 'in_progress' && (
                                                <button
                                                    onClick={() => handleMarkDone(complaint.id, 'complaint')}
                                                    className="flex-1 md:flex-none px-8 py-3 bg-green-500 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-green-600 shadow-md transition-all animate-pulse active:scale-95 flex items-center gap-2"
                                                >
                                                    <Camera className="w-4 h-4" /> Proof & Finish
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Routine Task List */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-emerald-100">
                    <div className="p-8 border-b border-emerald-50 flex items-center justify-between bg-emerald-50/30">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-6 h-6 text-emerald-600" />
                            <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Today's Schedule</h2>
                        </div>
                        <button onClick={fetchProfile} className="p-2 hover:bg-emerald-100 rounded-lg text-emerald-600 transition-all">
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-4 space-y-4">
                        {todayTasks.length === 0 ? (
                            <div className="text-center py-20 bg-emerald-50/20 rounded-2xl border-2 border-dashed border-emerald-100">
                                <Sparkles className="w-16 h-16 text-emerald-200 mx-auto mb-4" />
                                <p className="text-emerald-600 font-bold text-xl">No scheduled tasks for today.</p>
                                <p className="text-emerald-500 text-sm mt-1">
                                    Tasks usually appear here after the Warden generates them.<br />
                                    Check back in a few minutes or contact your Warden.
                                </p>
                            </div>
                        ) : (
                            todayTasks.map(task => (
                                <div key={task.id} className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg transition-all border-l-8 border-l-emerald-500">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-xl font-bold text-gray-800">{getLocationDisplay(task)}</h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase border ${getStatusColor(task.status)}`}>
                                                    {formatStatus(task.status)}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                                                <span className="flex items-center gap-2">📍 {getLocationDetails(task)}</span>
                                                {task.completedAt && (
                                                    <span className="flex items-center gap-2 text-emerald-600 font-bold">
                                                        <CheckCircle className="w-4 h-4" />
                                                        Finished at {new Date(task.completedAt).toLocaleTimeString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-3 w-full md:w-auto">
                                            {task.status === 'assigned' && (
                                                <button
                                                    onClick={() => {
                                                        setTaskType('routine');
                                                        updateTaskStatus(task.id, 'in_progress');
                                                    }}
                                                    className="flex-1 md:flex-none px-8 py-3 bg-emerald-600 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-emerald-700 shadow-md transition-all active:scale-95"
                                                >
                                                    Start Cleaning
                                                </button>
                                            )}
                                            {task.status === 'in_progress' && (
                                                <button
                                                    onClick={() => handleMarkDone(task.id, 'routine')}
                                                    className="flex-1 md:flex-none px-8 py-3 bg-green-500 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-green-600 shadow-md transition-all animate-pulse active:scale-95 flex items-center gap-2"
                                                >
                                                    <Camera className="w-4 h-4" /> Proof & Done
                                                </button>
                                            )}
                                            {task.status === 'completed' && (
                                                <div className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 font-black rounded-xl text-xs uppercase tracking-widest border border-emerald-100">
                                                    <CheckCircle className="w-4 h-4" /> Area Cleaned
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {task.notes && (
                                        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 italic border-l-4 border-emerald-200">
                                            Note: {task.notes}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* History Section */}
                {profile.cleaningTasks.some(t => !t.scheduledDate.startsWith(today)) && (
                    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden opacity-80 hover:opacity-100 transition-all">
                        <div className="p-6 border-b border-gray-50 flex items-center gap-3">
                            <Clock className="w-5 h-5 text-gray-400" />
                            <h3 className="font-bold text-gray-800 uppercase text-sm tracking-widest">Recent Activity</h3>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {profile.cleaningTasks
                                .filter(t => !t.scheduledDate.startsWith(today))
                                .slice(0, 5)
                                .map(task => (
                                    <div key={task.id} className="p-4 flex items-center justify-between text-sm">
                                        <div>
                                            <p className="font-bold text-gray-700">{getLocationDisplay(task)}</p>
                                            <p className="text-gray-500 text-xs">{new Date(task.scheduledDate).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getStatusColor(task.status)}`}>
                                            {formatStatus(task.status)}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Proof Modal */}
            {showProofModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                        <div className="bg-emerald-600 p-6 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Camera className="w-6 h-6" />
                                <h3 className="text-xl font-bold uppercase tracking-tight">Proof of Work</h3>
                            </div>
                            <button onClick={() => setShowProofModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700 uppercase tracking-widest">Cleaning Notes</label>
                                <textarea
                                    value={proofNotes}
                                    onChange={(e) => setProofNotes(e.target.value)}
                                    placeholder="Any specific details about the cleaning? (Optional)"
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm min-h-[100px]"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-700 uppercase tracking-widest">Photo Proof (Required)</label>

                                {proofImage ? (
                                    <div className="relative rounded-2xl overflow-hidden border-4 border-emerald-100 group shadow-md">
                                        <img src={proofImage} alt="Proof" className="w-full aspect-video object-cover" />
                                        <button
                                            onClick={() => setProofImage('')}
                                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full aspect-video bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-2xl cursor-pointer hover:bg-emerald-100 transition-all group">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <div className="p-4 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                                                <Camera className="w-8 h-8 text-emerald-600" />
                                            </div>
                                            <p className="text-sm text-emerald-700 font-bold">Tap to take photo</p>
                                            <p className="text-xs text-emerald-500 mt-1">Proof of cleanliness</p>
                                        </div>
                                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
                                    </label>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowProofModal(false)}
                                    className="flex-1 px-6 py-4 bg-gray-100 text-gray-600 font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitProof}
                                    disabled={!proofImage || isSubmittingProof}
                                    className={`flex-2 flex-grow-[2] px-6 py-4 font-black uppercase tracking-widest text-xs rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${!proofImage || isSubmittingProof
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                        }`}
                                >
                                    {isSubmittingProof ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Submit Proof
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CleanerDashboard;
