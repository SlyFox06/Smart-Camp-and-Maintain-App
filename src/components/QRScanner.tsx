import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, QrCode, AlertCircle } from 'lucide-react';
import QrScanner from 'qr-scanner';

interface QRScannerProps {
    onClose: () => void;
}

const QRScanner = ({ onClose }: QRScannerProps) => {
    const navigate = useNavigate();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [scanError, setScanError] = useState<string | null>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const scannerRef = useRef<QrScanner | null>(null);

    useEffect(() => {
        const initializeScanner = async () => {
            // Check removed to allow browser to handle permission request directly


            // 2. Check for Camera Hardware
            const hasCamera = await QrScanner.hasCamera();
            if (!hasCamera) {
                setScanError('No camera found on this device.');
                return;
            }

            // 3. Start Scanner
            if (videoRef.current) {
                scannerRef.current = new QrScanner(
                    videoRef.current,
                    (result) => handleScan(result),
                    {
                        returnDetailedScanResult: true,
                        highlightScanRegion: true,
                        highlightCodeOutline: true,
                        maxScansPerSecond: 5,
                    }
                );

                try {
                    await scannerRef.current.start();
                    setHasPermission(true);
                    setScanError(null);
                } catch (err) {
                    console.error('Failed to start scanner:', err);
                    setHasPermission(false);
                    setScanError('Camera permission denied or unavailable. Please allow camera access in your browser settings.');
                }
            }
        };

        initializeScanner();

        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop();
                scannerRef.current.destroy();
            }
        };
    }, []);

    const handleScan = (result: QrScanner.ScanResult) => {
        const data = result.data;
        if (!data) return;

        let assetId = '';

        try {
            const json = JSON.parse(data);
            // Handle simple { assetId: "..." } or { id: "..." }
            assetId = json.assetId || json.id || '';
        } catch (e) {
            // String parsing
            if (data.includes('/report/')) {
                assetId = data.split('/report/')[1].split('?')[0];
            } else if (data.includes('assetId=')) {
                assetId = data.split('assetId=')[1].split('&')[0];
            } else {
                // Determine if it's a UUID or simple ID (alphanumeric check)
                if (data.length > 2 && !data.includes(' ')) {
                    assetId = data;
                }
            }
        }

        if (assetId) {
            scannerRef.current?.stop();
            navigate(`/report/${assetId}`);
            onClose();
        }
    };

    const handleRetry = () => {
        setScanError(null);
        setHasPermission(null);
        if (scannerRef.current) {
            scannerRef.current.start()
                .then(() => {
                    setHasPermission(true);
                    setScanError(null);
                })
                .catch((err: any) => {
                    setScanError('Retry failed: ' + (err.message || 'Unknown error'));
                });
        } else {
            // If scanner not initialized (e.g. secure context error), try full re-init or reload
            window.location.reload();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 max-w-lg w-full relative overflow-hidden rounded-3xl shadow-2xl">
                {/* Header */}
                <div className="p-5 flex items-center justify-between z-10 relative bg-black/20">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <QrCode className="w-6 h-6 text-blue-400" />
                        Scan QR Code
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="relative aspect-[3/4] md:aspect-square bg-black group">
                    <video
                        ref={videoRef}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        playsInline
                        muted
                    />

                    {/* Scanning Overlay */}
                    {!scanError && hasPermission && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <div className="w-64 h-64 border-2 border-blue-500/50 rounded-3xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>

                                <div className="absolute inset-x-0 h-0.5 bg-blue-500/80 shadow-[0_0_15px_rgba(59,130,246,0.6)] animate-[scan_2s_ease-in-out_infinite]"></div>
                            </div>

                            <p className="absolute bottom-12 text-white/90 text-sm font-medium bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">
                                Align QR code within frame
                            </p>
                        </div>
                    )}

                    {/* Error State */}
                    {scanError && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white p-8 text-center">
                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                                <AlertCircle className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Camera Error</h3>
                            <p className="text-gray-300 mb-6">{scanError}</p>

                            {!window.isSecureContext && (
                                <div className="text-xs text-yellow-300 bg-yellow-900/30 p-3 rounded-lg mb-4 border border-yellow-500/30">
                                    💡 <strong>Tip for Mobile Testing:</strong><br />
                                    If testing on IP (192.168...), try Chrome flags:<br />
                                    <code>chrome://flags/#unsafely-treat-insecure-origin-as-secure</code>
                                </div>
                            )}

                            <button
                                onClick={handleRetry}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
                            >
                                Retry Camera
                            </button>
                        </div>
                    )}

                    {/* Permission Pending State */}
                    {!hasPermission && !scanError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/90">
                            <div className="text-white text-center">
                                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p>Requesting camera permission...</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes scan {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default QRScanner;
