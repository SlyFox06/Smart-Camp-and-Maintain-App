import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { Plus, Printer, BookOpen, X, AlertCircle, Search, Building } from 'lucide-react';
import api from '../services/api';

interface Classroom {
    id: string;
    name: string;
    building: string;
    floor: string;
    roomNumber: string;
    department: string;
    capacity?: number;
    type?: 'lecture_hall' | 'lab' | 'tutorial_room' | 'library';
    status: 'operational' | 'under_maintenance' | 'closed';
    qrUrl?: string;
    createdAt: string;
    updatedAt: string;
}

const ClassroomManagement = () => {
    const [showForm, setShowForm] = useState(false);
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        building: '',
        floor: '',
        roomNumber: '',
        department: '',
        capacity: '',
        type: 'lecture_hall' as 'lecture_hall' | 'lab' | 'tutorial_room' | 'library',
    });

    useEffect(() => {
        fetchClassrooms();
    }, []);

    const fetchClassrooms = async () => {
        try {
            const response = await api.get('/classrooms');
            setClassrooms(response.data);
        } catch (err) {
            console.error('Failed to fetch classrooms', err);
            setError('Failed to load classrooms');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = (classroom: Classroom) => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - ${classroom.name}</title>
            <style>
              body { font-family: sans-serif; text-align: center; padding: 20px; }
              .container { border: 2px dashed #000; padding: 20px; display: inline-block; }
              h2 { margin: 10px 0; }
              p { margin: 5px 0; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>${classroom.name}</h2>
              <div id="qr-target"></div>
              <p>${classroom.building} - ${classroom.roomNumber}</p>
              <p>Floor: ${classroom.floor}</p>
            </div>
          </body>
        </html>
      `);

            const svg = document.getElementById(`qr-${classroom.id}`)?.cloneNode(true);
            if (svg) {
                printWindow.document.getElementById('qr-target')?.appendChild(svg);
            }

            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => printWindow.print(), 500);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            await api.post('/classrooms', {
                ...formData,
                capacity: formData.capacity ? parseInt(formData.capacity) : null
            });
            await fetchClassrooms();
            setShowForm(false);
            setFormData({
                name: '',
                building: '',
                floor: '',
                roomNumber: '',
                department: '',
                capacity: '',
                type: 'lecture_hall',
            });
            alert('✅ Classroom Registered Successfully!');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to register classroom');
        }
    };

    const filteredClassrooms = classrooms.filter(classroom =>
        classroom.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        classroom.building.toLowerCase().includes(searchQuery.toLowerCase()) ||
        classroom.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        classroom.roomNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getTypeColor = (type?: string) => {
        switch (type) {
            case 'lab': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'lecture_hall': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'tutorial_room': return 'bg-green-100 text-green-700 border-green-200';
            case 'library': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const formatType = (type?: string) => {
        if (!type) return 'Room';
        return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        Classroom Management
                    </h3>
                    <p className="text-gray-500 text-sm">Manage classrooms and generate QR codes for issue reporting</p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search classrooms..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium whitespace-nowrap shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Register Classroom
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* Classroom List */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                    <div className="col-span-3 text-center py-12 text-gray-400 animate-pulse">Loading classrooms...</div>
                ) : filteredClassrooms.length === 0 ? (
                    <div className="col-span-3 text-center py-12 text-gray-400 bg-blue-50/30 rounded-xl border border-dashed border-blue-200">
                        <BookOpen className="w-16 h-16 text-blue-200 mx-auto mb-4" />
                        <p>No classrooms found. Register your first classroom!</p>
                    </div>
                ) : (
                    filteredClassrooms.map((classroom) => (
                        <div key={classroom.id} className="bg-white border border-blue-100 rounded-xl p-4 flex gap-4 hover:shadow-md transition-all duration-300">
                            <div className="bg-white p-2 rounded-lg border border-blue-100 shadow-sm flex-shrink-0 z-10 h-fit">
                                <QRCode
                                    id={`qr-${classroom.id}`}
                                    value={`${window.location.origin}/report-classroom/${classroom.id}`}
                                    size={80}
                                    level="M"
                                />
                            </div>

                            <div className="flex-1 min-w-0 z-10">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-gray-800 text-sm truncate">{classroom.name}</h4>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${getTypeColor(classroom.type)}`}>
                                        {formatType(classroom.type)}
                                    </span>
                                </div>

                                <p className="text-xs text-gray-400 mb-2 font-mono truncate">ID: {classroom.id.slice(0, 8)}</p>

                                <div className="flex flex-col gap-1 text-xs text-gray-500 mb-3">
                                    <div className="flex items-center gap-2">
                                        <Building className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                        <span className="font-medium truncate">{classroom.building} - {classroom.roomNumber}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="w-3 h-3 text-purple-500 flex-shrink-0" />
                                        <span className="truncate">{classroom.department}</span>
                                    </div>
                                    {classroom.capacity && (
                                        <span className="text-xs text-gray-400">Capacity: {classroom.capacity} seats</span>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handlePrint(classroom)}
                                        className="flex-1 flex items-center justify-center gap-2 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all"
                                    >
                                        <Printer className="w-3 h-3" />
                                        Print QR
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Registration Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-blue-600" />
                                    Register New Classroom
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">Add a classroom to enable QR-based issue reporting</p>
                            </div>
                            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white rounded-lg transition-colors text-gray-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Classroom Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    placeholder="e.g. Computer Lab 1, Lecture Hall A"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    >
                                        <option value="lecture_hall">Lecture Hall</option>
                                        <option value="lab">Lab</option>
                                        <option value="tutorial_room">Tutorial Room</option>
                                        <option value="library">Library</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        placeholder="e.g. CS"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Building *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.building}
                                        onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        placeholder="A-Block"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Floor *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.floor}
                                        onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        placeholder="2nd"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Room # *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.roomNumber}
                                        onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        placeholder="204"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (Seats)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="500"
                                    value={formData.capacity}
                                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    placeholder="e.g. 60"
                                />
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-md"
                                >
                                    Register Classroom
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassroomManagement;
