import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { Plus, Printer, Home, X, AlertCircle, Search, BedDouble } from 'lucide-react';
import api from '../services/api';

interface Room {
    id: string;
    roomNumber: string;
    block: string;
    floor: string;
    hostelName: string;
    capacity?: number;
    status: 'operational' | 'under_maintenance' | 'closed';
    qrUrl?: string;
    createdAt: string;
    updatedAt: string;
}

const RoomManagement = () => {
    const [showForm, setShowForm] = useState(false);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        roomNumber: '',
        block: '',
        floor: '',
        hostelName: '',
        capacity: '',
    });

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const response = await api.get('/rooms');
            setRooms(response.data);
        } catch (err) {
            console.error('Failed to fetch rooms', err);
            setError('Failed to load rooms');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = (room: Room) => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - Room ${room.roomNumber}</title>
            <style>
              body { font-family: sans-serif; text-align: center; padding: 20px; }
              .container { border: 2px dashed #000; padding: 20px; display: inline-block; }
              h2 { margin: 10px 0; }
              p { margin: 5px 0; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>Room ${room.roomNumber}</h2>
              <div id="qr-target"></div>
              <p>${room.hostelName} - ${room.block}</p>
              <p>Floor: ${room.floor}</p>
            </div>
          </body>
        </html>
      `);

            const svg = document.getElementById(`qr-${room.id}`)?.cloneNode(true);
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
            await api.post('/rooms', {
                ...formData,
                capacity: formData.capacity ? parseInt(formData.capacity) : null
            });
            await fetchRooms();
            setShowForm(false);
            setFormData({
                roomNumber: '',
                block: '',
                floor: '',
                hostelName: '',
                capacity: '',
            });
            alert('✅ Room Registered Successfully!');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to register room');
        }
    };

    const filteredRooms = rooms.filter(room =>
        room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.hostelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.block.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-orange-100 shadow-sm">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <BedDouble className="w-5 h-5 text-orange-600" />
                        Room Management
                    </h3>
                    <p className="text-gray-500 text-sm">Manage hostel rooms and generate QR codes</p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search rooms..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all font-medium whitespace-nowrap shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Register Room
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* Room List */}
            <div className="grid md:grid-cols-2 gap-4">
                {isLoading ? (
                    <div className="col-span-2 text-center py-12 text-gray-400 animate-pulse">Loading rooms...</div>
                ) : filteredRooms.length === 0 ? (
                    <div className="col-span-2 text-center py-12 text-gray-400 bg-orange-50/30 rounded-xl border border-dashed border-orange-200">
                        <Home className="w-16 h-16 text-orange-200 mx-auto mb-4" />
                        <p>No rooms found. Register your first hostel room!</p>
                    </div>
                ) : (
                    filteredRooms.map((room) => (
                        <div key={room.id} className="bg-white border border-orange-100 rounded-xl p-4 flex gap-4 hover:shadow-md transition-all duration-300">
                            <div className="bg-white p-2 rounded-lg border border-orange-100 shadow-sm flex-shrink-0 z-10 h-fit">
                                <QRCode
                                    id={`qr-${room.id}`}
                                    value={`${window.location.origin}/report-room/${room.id}`}
                                    size={80}
                                    level="M"
                                />
                            </div>

                            <div className="flex-1 min-w-0 z-10">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-gray-800 truncate">Room {room.roomNumber}</h4>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${room.status === 'operational'
                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                        : 'bg-red-100 text-red-700 border border-red-200'
                                        }`}>
                                        {room.status.toUpperCase()}
                                    </span>
                                </div>

                                <p className="text-xs text-gray-400 mb-2 font-mono">ID: {room.id.slice(0, 8)}</p>

                                <div className="flex flex-col gap-1 text-xs text-gray-500 mb-3">
                                    <div className="flex items-center gap-2">
                                        <Home className="w-3 h-3 text-orange-500" />
                                        <span className="font-medium">{room.hostelName}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <BedDouble className="w-3 h-3 text-blue-500" />
                                        <span>{room.block} • Floor {room.floor}</span>
                                        {room.capacity && <span>• {room.capacity} beds</span>}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handlePrint(room)}
                                        className="flex-1 flex items-center justify-center gap-2 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-xs font-bold hover:bg-orange-100 transition-all"
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
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <BedDouble className="w-5 h-5 text-orange-600" />
                                    Register New Room
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">Add a new hostel room to the system</p>
                            </div>
                            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white rounded-lg transition-colors text-gray-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Hostel Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.hostelName}
                                    onChange={(e) => setFormData({ ...formData, hostelName: e.target.value })}
                                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                                    placeholder="e.g. Boys Hostel 1"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Block *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.block}
                                        onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                                        placeholder="e.g. Block A"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Floor *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.floor}
                                        onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                                        placeholder="e.g. 2nd"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Room Number *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.roomNumber}
                                        onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                                        placeholder="e.g. 204"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (Beds)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={formData.capacity}
                                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                                        placeholder="e.g. 2"
                                    />
                                </div>
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
                                    className="flex-1 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-all shadow-md"
                                >
                                    Register Room
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomManagement;
