import { useState, useEffect } from 'react';
import { QrCode as QrIcon, Printer, AlertTriangle, X, Phone, MapPin, CheckCircle, Clock } from 'lucide-react';
import QRCode from 'react-qr-code';
import api from '../services/api';
import { formatDate } from '../utils/helpers';

interface Emergency {
    id: string;
    type: string;
    location: string;
    description: string;
    status: 'triggered' | 'responding' | 'resolved';
    reportedAt: string;
    reporter?: { name: string; phone: string };
    evidence?: string;
    isOfflineSync?: boolean;
}

const EmergencyManagement = () => {
    const [showQRModal, setShowQRModal] = useState(false);
    const [showLogModal, setShowLogModal] = useState(false);
    const [emergencies, setEmergencies] = useState<Emergency[]>([]);

    // Manual Log Form
    const [manualType, setManualType] = useState('Medical');
    const [manualLocation, setManualLocation] = useState('');
    const [manualDesc, setManualDesc] = useState('');
    const [manualAssetId, setManualAssetId] = useState('');

    const fetchEmergencies = async () => {
        try {
            const res = await api.get('/emergency');
            setEmergencies(res.data);
        } catch (e) {
            console.error('Failed to fetch emergencies', e);
        }
    };

    useEffect(() => {
        fetchEmergencies();
        const interval = setInterval(fetchEmergencies, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            await api.patch(`/emergency/${id}/status`, { status });
            fetchEmergencies();
        } catch (e) {
            alert('Failed to update status');
        }
    };

    const handleManualLog = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/emergency', {
                type: manualType,
                location: manualLocation,
                description: `[MANUAL LOG] ${manualDesc}`,
                assetId: manualAssetId || undefined,
                isOfflineSync: false
            });
            setShowLogModal(false);
            setManualLocation('');
            setManualDesc('');
            setManualAssetId('');
            fetchEmergencies();
            alert('Emergency logged successfully');
        } catch (e) {
            alert('Failed to log emergency');
        }
    };

    return (
        <div className="space-y-8">
            {/* Header stats could go here */}

            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                    Emergency Command Center
                </h2>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowLogModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-bold shadow-md"
                    >
                        <Phone className="w-4 h-4" />
                        Log Manual Call
                    </button>
                    <button
                        onClick={() => setShowQRModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 font-bold shadow-md"
                    >
                        <QrIcon className="w-4 h-4" />
                        Print QR
                    </button>
                </div>
            </div>

            {/* Active Emergencies List */}
            <div className="grid gap-4">
                {emergencies.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-gray-700">All Clear</h3>
                        <p className="text-gray-500">No active emergencies reported.</p>
                    </div>
                ) : (
                    emergencies.map(emergency => (
                        <div key={emergency.id} className={`p-6 rounded-xl border-l-4 shadow-sm bg-white ${emergency.status === 'triggered' ? 'border-red-500 animate-pulse-red' :
                            emergency.status === 'responding' ? 'border-amber-500' : 'border-green-500'
                            }`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${emergency.status === 'triggered' ? 'bg-red-100 text-red-700' :
                                            emergency.status === 'responding' ? 'bg-amber-100 text-amber-700' :
                                                'bg-green-100 text-green-700'
                                            }`}>
                                            {emergency.status}
                                        </span>
                                        <span className="text-sm text-gray-500 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatDate(emergency.reportedAt)}
                                        </span>
                                        {emergency.isOfflineSync && (
                                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                                                Synced
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
                                        {emergency.type} Emergency
                                    </h3>
                                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                                        <MapPin className="w-4 h-4" />
                                        {emergency.location}
                                    </div>
                                    {emergency.description && (
                                        <p className="text-gray-600 bg-gray-50 p-3 rounded-lg text-sm">
                                            "{emergency.description}"
                                        </p>
                                    )}
                                    {emergency.reporter && (
                                        <p className="text-sm text-gray-500 mt-2">
                                            Reported by: <span className="font-semibold">{emergency.reporter.name}</span> ({emergency.reporter.phone})
                                        </p>
                                    )}
                                    {emergency.evidence && (
                                        <div className="mt-3">
                                            <span className="text-xs font-bold text-gray-500 uppercase">Evidence</span>
                                            <img src={emergency.evidence} alt="Evidence" className="mt-1 h-20 rounded-lg border border-gray-200" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    {emergency.status === 'triggered' && (
                                        <button
                                            onClick={() => handleUpdateStatus(emergency.id, 'responding')}
                                            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-bold shadow-sm"
                                        >
                                            Ack & Respond
                                        </button>
                                    )}
                                    {emergency.status !== 'resolved' && (
                                        <button
                                            onClick={() => handleUpdateStatus(emergency.id, 'resolved')}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-bold shadow-sm"
                                        >
                                            Resolve & Close
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Manual Log Modal */}
            {showLogModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800">Log Emergency Call</h3>
                            <button onClick={() => setShowLogModal(false)}><X className="w-6 h-6 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleManualLog} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Emergency Type</label>
                                <select
                                    value={manualType}
                                    onChange={(e) => setManualType(e.target.value)}
                                    className="w-full p-3 border rounded-xl"
                                >
                                    <option>Medical</option>
                                    <option>Fire</option>
                                    <option>Lift Stuck</option>
                                    <option>Security</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Location</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Building, Floor, Room"
                                    value={manualLocation}
                                    onChange={(e) => setManualLocation(e.target.value)}
                                    className="w-full p-3 border rounded-xl"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Asset ID (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. LIFT-001"
                                    value={manualAssetId}
                                    onChange={(e) => setManualAssetId(e.target.value)}
                                    className="w-full p-3 border rounded-xl"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Details/Caller Info</label>
                                <textarea
                                    required
                                    placeholder="Caller name, number, specific details..."
                                    value={manualDesc}
                                    onChange={(e) => setManualDesc(e.target.value)}
                                    className="w-full p-3 border rounded-xl h-24"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 shadow-lg"
                            >
                                Log Emergency
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Existing QR Modal (Preserved but hidden logic updated) */}
            {showQRModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 transform scale-100 transition-all">
                        <div className="bg-red-600 p-6 text-white text-center relative">
                            <h2 className="text-2xl font-bold">Emergency QR</h2>
                            <button
                                onClick={() => setShowQRModal(false)}
                                className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-8 flex flex-col items-center bg-gray-50">
                            <div className="bg-white p-4 rounded-xl shadow-lg mb-6">
                                <QRCode
                                    value={`${window.location.origin}/sos`}
                                    size={200}
                                    fgColor="#DC2626"
                                />
                            </div>
                            <button
                                onClick={() => window.print()}
                                className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                            >
                                <Printer className="w-5 h-5" />
                                Print
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmergencyManagement;
