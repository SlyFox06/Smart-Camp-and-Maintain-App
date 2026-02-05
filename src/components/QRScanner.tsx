import { useState } from 'react';
import { X, QrCode, Camera } from 'lucide-react';
import { mockAssets } from '../data/mockData';
import ComplaintForm from './ComplaintForm';

interface QRScannerProps {
    onClose: () => void;
}

const QRScanner = ({ onClose }: QRScannerProps) => {
    const [scannedAssetId, setScannedAssetId] = useState<string | null>(null);
    const [showComplaintForm, setShowComplaintForm] = useState(false);

    // Simulate QR code scanning
    const simulateScan = () => {
        // Randomly select an asset for demo
        const randomAsset = mockAssets[Math.floor(Math.random() * mockAssets.length)];
        setScannedAssetId(randomAsset.id);
    };

    const scannedAsset = scannedAssetId ? mockAssets.find(a => a.id === scannedAssetId) : null;

    if (showComplaintForm && scannedAssetId) {
        return <ComplaintForm onClose={onClose} prefilledAssetId={scannedAssetId} />;
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card-light max-w-2xl w-full">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Scan QR Code</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-600" />
                    </button>
                </div>

                <div className="p-6">
                    {!scannedAsset ? (
                        <div className="text-center">
                            {/* QR Scanner Placeholder */}
                            <div className="relative w-full aspect-square max-w-md mx-auto mb-6 bg-gray-900 rounded-2xl overflow-hidden">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-64 h-64 border-4 border-white/30 rounded-2xl relative">
                                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500"></div>
                                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500"></div>
                                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500"></div>
                                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500"></div>

                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <QrCode className="w-24 h-24 text-white/50" />
                                        </div>
                                    </div>
                                </div>

                                {/* Scanning Line Animation */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-64 h-1 bg-blue-500 animate-pulse"></div>
                                </div>
                            </div>

                            <p className="text-gray-600 mb-6">
                                Position the QR code within the frame to scan
                            </p>

                            {/* Demo Button */}
                            <button
                                onClick={simulateScan}
                                className="btn-primary flex items-center gap-2 mx-auto"
                            >
                                <Camera className="w-5 h-5" />
                                Simulate QR Scan (Demo)
                            </button>

                            <p className="text-sm text-gray-500 mt-4">
                                In production, this would use your device camera
                            </p>
                        </div>
                    ) : (
                        <div className="text-center">
                            {/* Success Animation */}
                            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                                <QrCode className="w-12 h-12 text-white" />
                            </div>

                            <h3 className="text-2xl font-bold text-gray-900 mb-2">QR Code Scanned!</h3>
                            <p className="text-gray-600 mb-6">Asset details retrieved successfully</p>

                            {/* Asset Details */}
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 mb-6 text-left">
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-600">Asset Name</p>
                                        <p className="text-lg font-semibold text-gray-900">{scannedAsset.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Location</p>
                                        <p className="text-lg font-semibold text-gray-900">{scannedAsset.location}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Type</p>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {scannedAsset.type.replace('_', ' ').toUpperCase()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Department</p>
                                        <p className="text-lg font-semibold text-gray-900">{scannedAsset.department}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Status</p>
                                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${scannedAsset.status === 'operational' ? 'bg-green-100 text-green-800' :
                                                scannedAsset.status === 'under_maintenance' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                            }`}>
                                            {scannedAsset.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setScannedAssetId(null)}
                                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
                                >
                                    Scan Again
                                </button>
                                <button
                                    onClick={() => setShowComplaintForm(true)}
                                    className="flex-1 btn-primary"
                                >
                                    Report Issue
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QRScanner;
