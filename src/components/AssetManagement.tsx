import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { Plus, Printer, MapPin, Box, X, AlertCircle, Search } from 'lucide-react';
import type { Asset } from '../types';
import api from '../services/api';

interface AssetManagementProps {
    scope?: 'hostel' | 'college';
}

const AssetManagement = ({ scope }: AssetManagementProps) => {
    const [showForm, setShowForm] = useState(false);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        type: 'projector',
        building: scope === 'hostel' ? 'Hostel' : '',
        floor: '',
        room: '',
        department: scope === 'hostel' ? 'Hostel Administration' : '',
    });

    useEffect(() => {
        fetchAssets();
    }, [scope]);

    const fetchAssets = async () => {
        try {
            const response = await api.get('/assets', { params: { scope } });
            setAssets(response.data);
        } catch (err) {
            console.error('Failed to fetch assets', err);
            setError('Failed to load assets');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = (asset: Asset) => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - ${asset.id}</title>
            <style>
              body { font-family: sans-serif; text-align: center; padding: 20px; }
              .container { border: 2px dashed #000; padding: 20px; display: inline-block; }
              h2 { margin: 10px 0; }
              p { margin: 5px 0; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>${asset.name}</h2>
              <div id="qr-target"></div>
              <p>ID: ${asset.id}</p>
              <p>${asset.building} - ${asset.room}</p>
            </div>
          </body>
        </html>
      `);

            const svg = document.getElementById(`qr-${asset.id}`)?.cloneNode(true);
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
            await api.post('/assets', formData);
            await fetchAssets();
            setShowForm(false);
            setFormData({
                name: '',
                type: 'projector',
                building: '',
                floor: '',
                room: '',
                department: '',
            });
            alert('✅ Asset Registered Successfully!');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to register asset');
        }
    };

    const filteredAssets = assets.filter(asset =>
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">Asset Management</h3>
                    <p className="text-gray-500 text-sm">Manage and track campus assets</p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search assets..."
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
                        Register Asset
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* Asset List */}
            <div className="grid md:grid-cols-2 gap-4">
                {isLoading ? (
                    <div className="col-span-2 text-center py-12 text-gray-400 animate-pulse">Loading assets...</div>
                ) : filteredAssets.length === 0 ? (
                    <div className="col-span-2 text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">No assets found.</div>
                ) : (
                    filteredAssets.map((asset) => (
                        <div key={asset.id} className="bg-white border border-gray-100 rounded-xl p-4 flex gap-4 hover:shadow-md transition-all duration-300">
                            <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm flex-shrink-0 z-10 h-fit">
                                <QRCode
                                    id={`qr-${asset.id}`}
                                    value={`${window.location.origin}/report/${asset.id}`}
                                    size={80}
                                    level="M"
                                />
                            </div>

                            <div className="flex-1 min-w-0 z-10">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-gray-800 truncate">{asset.name}</h4>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${asset.status === 'operational'
                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                        : 'bg-red-100 text-red-700 border border-red-200'
                                        }`}>
                                        {(asset.status || 'operational').toUpperCase()}
                                    </span>
                                </div>

                                <p className="text-xs text-gray-400 mb-2 font-mono">ID: {asset.id}</p>

                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                    <Box className="w-3 h-3 text-purple-500" />
                                    <span className="capitalize">{asset.type}</span>
                                    <span className="mx-1 text-gray-300">•</span>
                                    <MapPin className="w-3 h-3 text-blue-500" />
                                    <span className="truncate">{asset.building}, {asset.room}</span>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handlePrint(asset)}
                                        className="flex-1 flex items-center justify-center gap-2 py-1.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-100 transition-all"
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
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-800">Register New Asset</h2>
                            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Asset Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    placeholder="e.g. Projector Lab 1"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    >
                                        <option value="projector">Projector</option>
                                        <option value="ac">AC Unit</option>
                                        <option value="computer">Computer</option>
                                        <option value="light">Lights</option>
                                        <option value="water_cooler">Water Cooler</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
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
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Building</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.building}
                                        onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        placeholder="A-Block"
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.floor}
                                        onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        placeholder="2nd"
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.room}
                                        onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        placeholder="204"
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
                                    className="flex-1 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-md"
                                >
                                    Register Asset
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssetManagement;
