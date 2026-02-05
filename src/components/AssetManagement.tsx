import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { Plus, Printer, MapPin, Box, X, AlertCircle } from 'lucide-react';
import type { Asset } from '../types';
import api from '../services/api';

const AssetManagement = () => {
    const [showForm, setShowForm] = useState(false);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        type: 'projector',
        building: '',
        floor: '',
        room: '',
        department: '',
    });

    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        try {
            const response = await api.get('/assets');
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Asset Management</h3>
                <button
                    onClick={() => setShowForm(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Register Asset
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* Asset List */}
            <div className="grid md:grid-cols-2 gap-4">
                {isLoading ? (
                    <div className="col-span-2 text-center py-12 text-gray-500">Loading assets...</div>
                ) : assets.length === 0 ? (
                    <div className="col-span-2 text-center py-12 text-gray-500">No assets registered yet.</div>
                ) : (
                    assets.map((asset) => (
                        <div key={asset.id} className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4">
                            <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm flex-shrink-0">
                                <QRCode
                                    id={`qr-${asset.id}`}
                                    value={`${window.location.origin}/report/${asset.id}`}
                                    size={80}
                                    level="M"
                                />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-gray-900 truncate">{asset.name}</h4>
                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${asset.status === 'operational' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {(asset.status || 'operational').toUpperCase()}
                                    </span>
                                </div>

                                <p className="text-xs text-gray-600 mb-1">ID: {asset.id}</p>

                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                    <Box className="w-3 h-3" />
                                    <span>{asset.type}</span>
                                    <span className="mx-1">•</span>
                                    <MapPin className="w-3 h-3" />
                                    <span className="truncate">{asset.building}, {asset.room}</span>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handlePrint(asset)}
                                        className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200"
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
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Register New Asset</h2>
                            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Asset Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input-field-light"
                                    placeholder="e.g. Projector Lab 1"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="input-field-light"
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
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Department</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        className="input-field-light"
                                        placeholder="e.g. CS"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-1">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Building</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.building}
                                        onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                                        className="input-field-light"
                                        placeholder="A-Block"
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Floor</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.floor}
                                        onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                                        className="input-field-light"
                                        placeholder="2nd"
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Room</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.room}
                                        onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                                        className="input-field-light"
                                        placeholder="204"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 btn-primary"
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
