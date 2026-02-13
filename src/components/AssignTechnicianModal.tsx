import { useState, useEffect } from 'react';
import { X, Search, CheckCircle, AlertCircle, MapPin } from 'lucide-react';
import api from '../services/api';
import type { User as UserType } from '../types';

interface AssignTechnicianModalProps {
    complaintId: string;
    onClose: () => void;
    onAssignSuccess: () => void;
}

const AssignTechnicianModal = ({ complaintId, onClose, onAssignSuccess }: AssignTechnicianModalProps) => {
    const [technicians, setTechnicians] = useState<UserType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTechId, setSelectedTechId] = useState<string | null>(null);
    const [isAssigning, setIsAssigning] = useState(false);

    useEffect(() => {
        const fetchTechnicians = async () => {
            try {
                const response = await api.get('/admin/users', { params: { role: 'technician' } });
                // Sort by availability (available first)
                const sortedTechs = response.data.sort((a: UserType, b: UserType) => {
                    const aAvail = a.technician?.isAvailable ? 1 : 0;
                    const bAvail = b.technician?.isAvailable ? 1 : 0;
                    return bAvail - aAvail;
                });
                setTechnicians(sortedTechs);
            } catch (error) {
                console.error('Failed to fetch technicians', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTechnicians();
    }, []);

    const handleAssign = async () => {
        if (!selectedTechId) return;
        setIsAssigning(true);
        try {
            await api.post(`/complaints/${complaintId}/assign`, { technicianId: selectedTechId });
            onAssignSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to assign technician', error);
            alert('Failed to assign technician');
        } finally {
            setIsAssigning(false);
        }
    };

    const filteredTechnicians = technicians.filter(tech =>
        tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tech.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tech.technician?.skillType?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-xl font-bold text-gray-900">Assign Technician</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search technicians..."
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[400px]">
                    {isLoading ? (
                        <div className="text-center py-8 text-gray-500">Loading technicians...</div>
                    ) : technicians.length === 0 ? (
                        <div className="text-center py-8 flex flex-col items-center">
                            <AlertCircle className="w-10 h-10 text-gray-300 mb-2" />
                            <p className="text-gray-500 font-medium">No technicians found</p>
                            <p className="text-xs text-gray-400">Add technicians via Admin Dashboard</p>
                        </div>
                    ) : filteredTechnicians.length === 0 ? (
                        <p className="text-center py-8 text-gray-500">No matches found.</p>
                    ) : (
                        filteredTechnicians.map((tech) => {
                            const isAvailable = tech.technician?.isAvailable ?? false;

                            return (
                                <div
                                    key={tech.id}
                                    onClick={() => isAvailable && setSelectedTechId(tech.id)}
                                    className={`p-3 rounded-xl border transition-all flex items-center gap-3 relative ${!isAvailable
                                            ? 'opacity-60 bg-gray-50 border-gray-100 cursor-not-allowed'
                                            : selectedTechId === tech.id
                                                ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500 cursor-pointer'
                                                : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50 cursor-pointer'
                                        }`}
                                >
                                    <img
                                        src={tech.avatar || `https://ui-avatars.com/api/?name=${tech.name}`}
                                        alt={tech.name}
                                        className="w-10 h-10 rounded-full bg-gray-200"
                                    />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className={`font-semibold text-sm ${!isAvailable ? 'text-gray-500' : 'text-gray-900'}`}>
                                                {tech.name}
                                            </h4>
                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wide ${isAvailable
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                }`}>
                                                {isAvailable ? 'Available' : 'Unavailable'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500">{tech.technician?.skillType || 'General'}</p>
                                        {tech.technician?.assignedArea && (
                                            <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                                                <MapPin className="w-3 h-3" />
                                                {tech.technician.assignedArea}
                                            </div>
                                        )}
                                    </div>
                                    {selectedTechId === tech.id && isAvailable && (
                                        <CheckCircle className="w-5 h-5 text-purple-600" />
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={!selectedTechId || isAssigning}
                        className="bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold shadow-lg shadow-purple-200 transition-all flex items-center gap-2"
                    >
                        {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssignTechnicianModal;
