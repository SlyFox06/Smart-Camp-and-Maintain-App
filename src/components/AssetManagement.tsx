import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { Plus, Printer, MapPin, Box, X, AlertCircle, Search } from 'lucide-react';
import type { Asset } from '../types';
import api from '../services/api';

const AssetManagement = () => {
    const [showForm, setShowForm] = useState(false);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

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

    const filteredAssets = assets.filter(asset =>
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#0a0e27]/40 p-4 rounded-xl border border-[#00d4ff]/20 backdrop-blur-sm">
                <div>
                    <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00D4FF] neon-text">Asset Management</h3>
                    <p className="text-cyan-200/60 text-sm">Manage and track campus assets</p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00D4FF] w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search assets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#0a0e27]/90 border border-[#00d4ff]/40 text-white placeholder-slate-400 focus:outline-none focus:border-[#00d4ff] shadow-[0_0_20px_rgba(0,212,255,0.1)] transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-[#00D4FF] to-[#3B82F6] text-white rounded-lg shadow-[0_6px_20px_rgba(0,212,255,0.5),0_0_30px_rgba(0,212,255,0.3)] hover:scale-105 hover:brightness-110 transition-all font-medium backdrop-blur-sm whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" />
                        Register Asset
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3 backdrop-blur-sm">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <p className="text-red-400">{error}</p>
                </div>
            )}

            {/* Asset List */}
            <div className="grid md:grid-cols-2 gap-4">
                {isLoading ? (
                    <div className="col-span-2 text-center py-12 text-cyan-200/50 animate-pulse">Loading assets...</div>
                ) : filteredAssets.length === 0 ? (
                    <div className="col-span-2 text-center py-12 text-cyan-200/50 bg-[#0a0e27]/40 rounded-xl border border-dashed border-[#00d4ff]/20">No assets found.</div>
                ) : (
                    filteredAssets.map((asset) => (
                        <div key={asset.id} className="relative group bg-[#0a0e27]/60 border border-[#00d4ff]/20 rounded-xl p-4 flex gap-4 hover:bg-[#0a0e27]/80 hover:border-[#00d4ff]/50 hover:shadow-[0_0_30px_rgba(0,212,255,0.1)] transition-all duration-300 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#00d4ff]/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

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
                                    <h4 className="font-bold text-white group-hover:text-[#00D4FF] transition-colors truncate">{asset.name}</h4>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${asset.status === 'operational'
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                                        : 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                                        }`}>
                                        {(asset.status || 'operational').toUpperCase()}
                                    </span>
                                </div>

                                <p className="text-xs text-cyan-200/50 mb-2 font-mono">ID: {asset.id}</p>

                                <div className="flex items-center gap-2 text-xs text-slate-300 mb-3">
                                    <Box className="w-3 h-3 text-purple-400" />
                                    <span className="capitalize">{asset.type}</span>
                                    <span className="mx-1 text-[#00d4ff]/20">•</span>
                                    <MapPin className="w-3 h-3 text-[#00D4FF]" />
                                    <span className="truncate">{asset.building}, {asset.room}</span>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handlePrint(asset)}
                                        className="flex-1 flex items-center justify-center gap-2 py-1.5 bg-[#00d4ff]/10 text-[#00D4FF] border border-[#00d4ff]/30 rounded-lg text-xs font-bold hover:bg-[#00d4ff]/20 hover:shadow-[0_0_15px_rgba(0,212,255,0.3)] transition-all"
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
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-[#0a0e27] rounded-2xl shadow-[0_0_50px_rgba(0,212,255,0.2)] border border-[#00d4ff]/30 max-w-lg w-full max-h-[90vh] overflow-y-auto relative">
                        <div className="absolute top-0 right-0 p-32 bg-[#00d4ff]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                        <div className="p-6 border-b border-[#00d4ff]/20 flex items-center justify-between relative z-10">
                            <h2 className="text-xl font-bold text-white">Register New Asset</h2>
                            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 relative z-10">
                            <div>
                                <label className="block text-sm font-medium text-cyan-200/80 mb-1">Asset Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-[#000000]/40 border border-[#00d4ff]/30 rounded-lg text-white focus:outline-none focus:border-[#00d4ff] focus:shadow-[0_0_15px_rgba(0,212,255,0.2)] transition-all placeholder-slate-500"
                                    placeholder="e.g. Projector Lab 1"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-cyan-200/80 mb-1">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full px-4 py-2 bg-[#000000]/40 border border-[#00d4ff]/30 rounded-lg text-white focus:outline-none focus:border-[#00d4ff] transition-all"
                                        style={{ colorScheme: 'dark' }}
                                    >
                                        <option value="projector" className="bg-[#0a0e27]">Projector</option>
                                        <option value="ac" className="bg-[#0a0e27]">AC Unit</option>
                                        <option value="computer" className="bg-[#0a0e27]">Computer</option>
                                        <option value="light" className="bg-[#0a0e27]">Lights</option>
                                        <option value="water_cooler" className="bg-[#0a0e27]">Water Cooler</option>
                                        <option value="other" className="bg-[#0a0e27]">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-cyan-200/80 mb-1">Department</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        className="w-full px-4 py-2 bg-[#000000]/40 border border-[#00d4ff]/30 rounded-lg text-white focus:outline-none focus:border-[#00d4ff] transition-all placeholder-slate-500"
                                        placeholder="e.g. CS"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-cyan-200/80 mb-1">Building</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.building}
                                        onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                                        className="w-full px-4 py-2 bg-[#000000]/40 border border-[#00d4ff]/30 rounded-lg text-white focus:outline-none focus:border-[#00d4ff] transition-all placeholder-slate-500"
                                        placeholder="A-Block"
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-cyan-200/80 mb-1">Floor</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.floor}
                                        onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                                        className="w-full px-4 py-2 bg-[#000000]/40 border border-[#00d4ff]/30 rounded-lg text-white focus:outline-none focus:border-[#00d4ff] transition-all placeholder-slate-500"
                                        placeholder="2nd"
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-cyan-200/80 mb-1">Room</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.room}
                                        onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                                        className="w-full px-4 py-2 bg-[#000000]/40 border border-[#00d4ff]/30 rounded-lg text-white focus:outline-none focus:border-[#00d4ff] transition-all placeholder-slate-500"
                                        placeholder="204"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 px-4 py-2 bg-[#00d4ff]/10 text-white font-semibold rounded-lg hover:bg-[#00d4ff]/20 border border-[#00d4ff]/30 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-gradient-to-br from-[#00D4FF] to-[#3B82F6] text-white font-bold rounded-lg shadow-[0_0_20px_rgba(0,212,255,0.4)] hover:brightness-110 hover:scale-105 transition-all"
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
