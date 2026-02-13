import { useState, useEffect } from 'react';
import { Sparkles, Users, Calendar, CheckCircle, Clock, AlertCircle, UserCheck, UserX, Plus, RefreshCw, AlertTriangle, QrCode as QrIcon, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import api from '../services/api';

interface Cleaner {
    id: string;
    userId: string;
    assignedArea: string;
    isAvailable: boolean;
    lastAvailabilityUpdate: string | null;
    user: {
        id: string;
        name: string;
        email: string;
        phone: string;
        isActive: boolean;
    };
    cleaningTasks: CleaningTask[];
}

interface CleaningTask {
    id: string;
    classroomId: string;
    cleanerId: string | null;
    scheduledDate: string;
    status: string;
    assignedAt: string | null;
    completedAt: string | null;
    notes: string | null;
    classroom: {
        id: string;
        name: string;
        building: string;
        floor: string;
        roomNumber: string;
    };
    cleaner?: {
        id: string;
        user: {
            name: string;
            email: string;
        };
    };
}

const CleaningManagement = () => {
    const [cleaners, setCleaners] = useState<Cleaner[]>([]);
    const [tasks, setTasks] = useState<CleaningTask[]>([]);
    const [statistics, setStatistics] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<CleaningTask | null>(null);
    const [selectedCleanerId, setSelectedCleanerId] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showQRModal, setShowQRModal] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, [selectedDate, statusFilter]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch cleaners
            const cleanersRes = await api.get('/cleaners');
            setCleaners(cleanersRes.data);

            // Fetch tasks with filters
            const params: any = { date: selectedDate };
            if (statusFilter !== 'all') {
                params.status = statusFilter;
            }
            const tasksRes = await api.get('/cleaning-tasks', { params });
            setTasks(tasksRes.data);

            // Fetch statistics
            const statsRes = await api.get('/cleaning-tasks/statistics', { params: { date: selectedDate } });
            setStatistics(statsRes.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateTasks = async () => {
        try {
            const response = await api.post('/cleaning-tasks/generate', { date: selectedDate });
            alert(`Generated ${response.data.tasksCreated} new tasks!`);
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to generate tasks');
        }
    };

    const handleAssignTask = async () => {
        if (!selectedTask || !selectedCleanerId) return;

        try {
            await api.put(`/cleaning-tasks/${selectedTask.id}/assign`, { cleanerId: selectedCleanerId });
            alert('✅ Task assigned successfully!');
            setShowAssignModal(false);
            setSelectedTask(null);
            setSelectedCleanerId('');
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to assign task');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending_assignment': return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'waiting_for_availability': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'assigned': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'in_progress': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'completed': return 'bg-green-100 text-green-700 border-green-200';
            case 'skipped': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const formatStatus = (status: string) => {
        return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const availableCleaners = cleaners.filter(c => c.isAvailable);
    const unavailableCleaners = cleaners.filter(c => !c.isAvailable);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-emerald-100 shadow-sm">
                <div>
                    <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-emerald-600" />
                        Cleaning Management
                    </h3>
                    <p className="text-gray-500 text-sm mt-1">Manage daily classroom cleaning tasks and cleaner assignments</p>
                </div>



                <div className="flex gap-3 flex-wrap">
                    <button
                        onClick={() => navigate('/sos')}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-bold shadow-md animate-pulse"
                    >
                        <AlertTriangle className="w-4 h-4" />
                        SOS
                    </button>
                    <button
                        onClick={() => setShowQRModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-medium shadow-sm"
                    >
                        <QrIcon className="w-4 h-4" />
                        Emergency QR
                    </button>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                        onClick={handleGenerateTasks}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-medium shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Generate Tasks
                    </button>
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>
            </div>

            {
                error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <p className="text-red-700">{error}</p>
                    </div>
                )
            }

            {/* Statistics */}
            {
                statistics && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {Object.entries(statistics.statistics || {}).map(([status, count]: [string, any]) => (
                            <div key={status} className="bg-white border border-gray-100 rounded-xl p-4 text-center hover:shadow-md transition-all">
                                <p className="text-3xl font-bold text-emerald-600 mb-1">{count}</p>
                                <p className="text-xs text-gray-500 uppercase tracking-wider">{formatStatus(status)}</p>
                            </div>
                        ))}
                    </div>
                )
            }

            {/* Cleaner Availability */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Available Cleaners */}
                <div className="bg-white border border-emerald-100 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-emerald-600" />
                        Available Cleaners ({availableCleaners.length})
                    </h4>
                    <div className="space-y-3">
                        {availableCleaners.length === 0 ? (
                            <p className="text-gray-400 text-center py-4">No cleaners available</p>
                        ) : (
                            availableCleaners.map(cleaner => (
                                <div key={cleaner.id} className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                    <div>
                                        <p className="font-semibold text-gray-800">{cleaner.user.name}</p>
                                        <p className="text-xs text-gray-500">{cleaner.assignedArea}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded">
                                            {cleaner.cleaningTasks.length} tasks
                                        </span>
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Unavailable Cleaners */}
                <div className="bg-white border border-gray-100 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <UserX className="w-5 h-5 text-gray-400" />
                        Unavailable Cleaners ({unavailableCleaners.length})
                    </h4>
                    <div className="space-y-3">
                        {unavailableCleaners.length === 0 ? (
                            <p className="text-gray-400 text-center py-4">All cleaners available</p>
                        ) : (
                            unavailableCleaners.map(cleaner => (
                                <div key={cleaner.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg opacity-60">
                                    <div>
                                        <p className="font-semibold text-gray-800">{cleaner.user.name}</p>
                                        <p className="text-xs text-gray-500">{cleaner.assignedArea}</p>
                                    </div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Task List */}
            <div className="bg-white border border-gray-100 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-emerald-600" />
                        Cleaning Tasks ({tasks.length})
                    </h4>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    >
                        <option value="all">All Status</option>
                        <option value="pending_assignment">Pending Assignment</option>
                        <option value="waiting_for_availability">Waiting</option>
                        <option value="assigned">Assigned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>

                {isLoading ? (
                    <div className="text-center py-12 text-gray-400 animate-pulse">Loading tasks...</div>
                ) : tasks.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-400">No tasks found for this date</p>
                        <button
                            onClick={handleGenerateTasks}
                            className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all"
                        >
                            Generate Tasks
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {tasks.map(task => (
                            <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:shadow-md transition-all">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <h5 className="font-bold text-gray-800">{task.classroom.name}</h5>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(task.status)}`}>
                                            {formatStatus(task.status)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                        <span>📍 {task.classroom.building} - {task.classroom.roomNumber}</span>
                                        {task.cleaner && (
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3.5 h-3.5" />
                                                {task.cleaner.user.name}
                                            </span>
                                        )}
                                        {task.assignedAt && (
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                Assigned {new Date(task.assignedAt).toLocaleTimeString()}
                                            </span>
                                        )}
                                        {task.completedAt && (
                                            <span className="flex items-center gap-1 text-green-600">
                                                <CheckCircle className="w-3.5 h-3.5" />
                                                Completed {new Date(task.completedAt).toLocaleTimeString()}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {task.status !== 'completed' && (
                                    <button
                                        onClick={() => {
                                            setSelectedTask(task);
                                            setSelectedCleanerId(task.cleanerId || '');
                                            setShowAssignModal(true);
                                        }}
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all text-sm font-medium"
                                    >
                                        {task.cleanerId ? 'Reassign' : 'Assign'}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Assignment Modal */}
            {
                showAssignModal && selectedTask && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
                            <div className="p-6 border-b border-gray-100">
                                <h3 className="text-xl font-bold text-gray-800">Assign Cleaner</h3>
                                <p className="text-sm text-gray-500 mt-1">{selectedTask.classroom.name}</p>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Cleaner</label>
                                    <select
                                        value={selectedCleanerId}
                                        onChange={(e) => setSelectedCleanerId(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="">Choose a cleaner...</option>
                                        {cleaners
                                            .filter(c => c.assignedArea === selectedTask.classroom.building)
                                            .map(cleaner => (
                                                <option key={cleaner.id} value={cleaner.id}>
                                                    {cleaner.user.name} - {cleaner.assignedArea}
                                                    {cleaner.isAvailable ? ' ✓ Available' : ' ✗ Unavailable'}
                                                </option>
                                            ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Only showing cleaners assigned to {selectedTask.classroom.building}
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-100 flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowAssignModal(false);
                                        setSelectedTask(null);
                                        setSelectedCleanerId('');
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAssignTask}
                                    disabled={!selectedCleanerId}
                                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Assign Task
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* QR Code Modal for Cleaners */}
            {
                showQRModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
                        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 transform scale-100 transition-all">
                            <div className="bg-gradient-to-r from-red-600 to-red-700 p-8 text-white text-center relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                                <AlertTriangle className="w-16 h-16 mx-auto mb-4 animate-bounce" />
                                <h2 className="text-3xl font-black uppercase tracking-widest text-white drop-shadow-md">Emergency SOS</h2>
                                <p className="text-red-100 font-medium mt-2">Scan for Instant Help</p>
                                <button
                                    onClick={() => setShowQRModal(false)}
                                    className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/20 hover:bg-white/30 p-2 rounded-full transition-all"
                                >
                                    <UserX className="w-6 h-6 rotate-45" />
                                </button>
                            </div>

                            <div className="p-10 flex flex-col items-center bg-gray-50">
                                <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-gray-200 mb-6">
                                    <QRCode
                                        value={`${window.location.origin}/sos`}
                                        size={250}
                                        level="H"
                                        fgColor="#DC2626"
                                    />
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 w-full mb-6">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-blue-100 p-2 rounded-full">
                                            <Users className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800">For Cleaning Staff Only</h4>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Place this QR code in cleaning supplies rooms, restrooms, and corridors.
                                                Staff can scan this to verify presence or report emergencies instantly.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => window.print()}
                                    className="w-full bg-gray-900 hover:bg-gray-800 text-white py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1"
                                >
                                    <Printer className="w-6 h-6" />
                                    Print SOS Poster
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default CleaningManagement;
