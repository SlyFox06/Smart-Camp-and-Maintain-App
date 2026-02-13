import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, MapPin, Camera, Phone, Save, Signal, X, Siren } from 'lucide-react';
import api from '../../services/api';
import useNetworkStatus from '../../hooks/useNetworkStatus';
import { saveOfflineEmergency, removeOfflineEmergency, getOfflineEmergencies } from '../../services/offlineStorage';
import type { OfflineEmergency } from '../../services/offlineStorage';

const EMERGENCY_TYPES = [
    { id: 'lift', label: 'Lift Stuck', icon: '🛗' },
    { id: 'fire', label: 'Fire', icon: '🔥' },
    { id: 'medical', label: 'Medical', icon: '🚑' },
    { id: 'electrical', label: 'Electrical Hazard', icon: '⚡' },
    { id: 'safety', label: 'Safety Issue', icon: '🛡️' },
    { id: 'other', label: 'Other', icon: '🚨' }
];

const SAFE_LOCATIONS = [
    { name: 'Boys Hostel 1', coords: { lat: 0, lng: 0 } },
    { name: 'Girls Hostel 1', coords: { lat: 0, lng: 0 } },
    { name: 'Main Building', coords: { lat: 0, lng: 0 } },
    { name: 'Library', coords: { lat: 0, lng: 0 } },
    { name: 'Cafeteria', coords: { lat: 0, lng: 0 } }
];

const EMERGENCY_CONTACT = "1800-123-4567"; // Mock emergency number

const SOSButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(1); // 1: Type, 2: Details, 3: Success/Offline
    const [selectedType, setSelectedType] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [offlineData, setOfflineData] = useState<OfflineEmergency | null>(null);

    const isOnline = useNetworkStatus();
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Sync offline data when online
        if (isOnline) {
            const offlineEmergencies = getOfflineEmergencies();
            if (offlineEmergencies.length > 0) {
                syncOfflineEmergencies(offlineEmergencies);
            }
        }
    }, [isOnline]);

    const syncOfflineEmergencies = async (emergencies: OfflineEmergency[]) => {
        for (const emergency of emergencies) {
            try {
                await api.post('/emergency', {
                    ...emergency,
                    isOfflineSync: true,
                    reportedAt: new Date(emergency.timestamp).toISOString()
                });
                removeOfflineEmergency(emergency.id);
                // Optionally show a toast for synced item
                console.log('Synced emergency:', emergency.id);
            } catch (error) {
                console.error('Failed to sync emergency:', error);
            }
        }
        alert('✅ Offline SOS alerts have been synced to the server.');
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Image too large (max 5MB)');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        if (!selectedType || !location) {
            alert('Please select type and location');
            return;
        }

        setIsLoading(true);

        const payload = {
            type: selectedType,
            location: { text: location }, // Simple text location for now
            description,
            evidence: image,
            assetId: null // Can be enhanced to scan QR code
        };

        if (isOnline) {
            try {
                await api.post('/emergency', payload);
                setStep(3); // Success Screen
            } catch (error) {
                console.error('SOS Failed:', error);
                alert('Connection failed. Saving locally.');
                handleOfflineSave(payload);
            } finally {
                setIsLoading(false);
            }
        } else {
            // Offline Mode
            handleOfflineSave(payload);
            setIsLoading(false);
        }
    };

    const handleOfflineSave = (payload: any) => {
        const saved = saveOfflineEmergency({
            type: payload.type,
            location: payload.location,
            description: payload.description,
            evidence: payload.evidence,
            assetId: payload.assetId
        });
        setOfflineData(saved);
        setStep(3); // Show offline success/fallback screen
    };

    const resetForm = () => {
        setIsOpen(false);
        setStep(1);
        setSelectedType('');
        setLocation('');
        setDescription('');
        setImage(null);
        setOfflineData(null);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 bg-red-600 text-white p-4 rounded-full shadow-lg hover:bg-red-700 hover:scale-105 transition-all animate-pulse"
                aria-label="Trigger SOS"
            >
                <div className="flex flex-col items-center">
                    <Siren className="w-8 h-8" />
                    <span className="text-[10px] font-bold mt-1">SOS</span>
                </div>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative">
                {/* Header */}
                <div className="bg-red-600 p-4 text-white flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Siren className="w-6 h-6 animate-pulse" />
                        <h2 className="text-xl font-bold tracking-tight">EMERGENCY SOS</h2>
                    </div>
                    <button onClick={resetForm} className="p-1 hover:bg-red-700 rounded-full">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    {!isOnline && step !== 3 && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg text-sm mb-4 flex items-center gap-2">
                            <Signal className="w-4 h-4" />
                            <span>You are offline. Request will be saved locally.</span>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-4">
                            <p className="text-gray-600 text-center font-medium">Select Emergency Type</p>
                            <div className="grid grid-cols-2 gap-3">
                                {EMERGENCY_TYPES.map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => {
                                            setSelectedType(type.id);
                                            setStep(2);
                                        }}
                                        className="p-4 bg-gray-50 border-2 border-gray-100 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all flex flex-col items-center gap-2"
                                    >
                                        <span className="text-3xl">{type.icon}</span>
                                        <span className="font-semibold text-gray-700">{type.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Your Location *</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="e.g. Library 2nd Floor"
                                        className="w-full pl-10 p-3 border rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                                    />
                                </div>
                                <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                                    {SAFE_LOCATIONS.map(loc => (
                                        <button
                                            key={loc.name}
                                            onClick={() => setLocation(loc.name)}
                                            className="whitespace-nowrap px-3 py-1 bg-gray-100 text-xs rounded-full hover:bg-gray-200"
                                        >
                                            {loc.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Details (Optional)</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Briefly describe the situation..."
                                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-red-500 outline-none h-20 resize-none"
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Photo Evidence</label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors"
                                >
                                    <Camera className="w-5 h-5 text-gray-500" />
                                    <span className="text-gray-500 text-sm">
                                        {image ? 'Change Photo' : 'Take/Upload Photo'}
                                    </span>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />
                                {image && (
                                    <div className="mt-2 h-20 w-full bg-gray-100 rounded-lg overflow-hidden">
                                        <img src={image} alt="Evidence" className="h-full w-full object-cover" />
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 py-3 text-gray-600 font-semibold"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    className="flex-[2] bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 shadow-lg disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {isLoading ? 'Sending...' : (isOnline ? 'SEND ALERT' : 'SAVE ALERT (OFFLINE)')}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="text-center py-6">
                            {isOnline && !offlineData ? (
                                <>
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                        <AlertTriangle className="w-10 h-10 text-green-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Help is on the way!</h3>
                                    <p className="text-gray-600 mb-6">
                                        Your emergency alert has been broadcasted to all nearby security and maintenance staff.
                                    </p>
                                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-6">
                                        <p className="text-sm text-red-800 font-medium mb-1">Estimated Response Time</p>
                                        <p className="text-2xl font-black text-red-600">~2-5 Mins</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Save className="w-10 h-10 text-amber-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Alert Saved Offline</h3>
                                    <p className="text-gray-600 mb-6">
                                        No internet connection. Your alert has been saved and will <strong>auto-sync</strong> when you are back online.
                                    </p>
                                    <div className="bg-red-100 p-6 rounded-xl border border-red-200 mb-6">
                                        <p className="font-bold text-red-800 mb-3">Call Emergency Helpline</p>
                                        <a
                                            href={`tel:${EMERGENCY_CONTACT}`}
                                            className="flex items-center justify-center gap-3 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 shadow-lg"
                                        >
                                            <Phone className="w-5 h-5 fill-current" />
                                            {EMERGENCY_CONTACT}
                                        </a>
                                    </div>
                                    <div className="text-left bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
                                        <p><strong>Saved Details:</strong></p>
                                        <p>Type: {offlineData?.type}</p>
                                        <p>Location: {typeof offlineData?.location === 'string' ? offlineData?.location : offlineData?.location?.text}</p>
                                    </div>
                                </>
                            )}

                            <button
                                onClick={resetForm}
                                className="w-full py-3 text-gray-500 font-medium hover:text-gray-700"
                            >
                                Close & Monitor
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SOSButton;
