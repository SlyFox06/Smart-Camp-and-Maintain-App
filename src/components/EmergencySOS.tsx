
import { useState, useEffect } from 'react';
import { getCurrentLocation } from '../utils/helpers';
import api from '../services/api';
import { AlertTriangle, Flame, Phone, CheckCircle, HeartPulse, Zap } from 'lucide-react';

const EmergencySOS = () => {
    const [status, setStatus] = useState<'idle' | 'triggered' | 'confirmed' | 'failed'>('idle');
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [emergencyType, setEmergencyType] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        // Attempt to get location on mount, silently fail if not available
        getCurrentLocation()
            .then(setLocation)
            .catch(() => {
                // Silently fail - location will be reported as "unknown" if needed
                // This prevents console errors while still allowing emergency reporting
            });
    }, []);

    const handleEmergency = async (type: string) => {
        setEmergencyType(type);
        setStatus('triggered');

        try {
            // Re-attempt location if null or reuse existing
            let loc = location;
            if (!loc) {
                try {
                    loc = await getCurrentLocation();
                } catch {
                    // Proceed without precise location if failed
                }
            }

            await api.post('/emergency', {
                type,
                location: loc ? { latitude: loc.latitude, longitude: loc.longitude } : { text: "Location unknown (GPS failed)" },
                description: `Emergency reported via SOS panel.`
            });

            setStatus('confirmed');
        } catch (error) {
            console.error(error);
            setStatus('failed');
            setErrorMessage('Alert Failed. Please call security immediately!');
        }
    };

    if (status === 'confirmed') {
        return (
            <div className="fixed inset-0 bg-red-600 text-white flex flex-col items-center justify-center p-6 text-center animate-pulse z-50">
                <CheckCircle className="w-32 h-32 mb-6" />
                <h1 className="text-4xl font-black mb-4 uppercase">Help is on the way!</h1>
                <p className="text-xl mb-8 font-bold">Security and Maintenance teams have been alerted.</p>
                <div className="bg-white/20 p-6 rounded-xl w-full max-w-md backdrop-blur-sm border border-white/30">
                    <p className="font-bold text-2xl mb-2">{emergencyType}</p>
                    <p className="opacity-90">Location captured and sent.</p>
                </div>
                <p className="mt-12 text-sm opacity-75">Stay calm and wait for assistance.</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-8 px-6 py-2 bg-white text-red-600 rounded-full font-bold text-sm hover:bg-gray-100"
                >
                    Report Another
                </button>
            </div>
        );
    }

    if (status === 'triggered') {
        return (
            <div className="fixed inset-0 bg-red-700 flex flex-col items-center justify-center p-6 text-white text-center z-50">
                <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-6"></div>
                <h2 className="text-3xl font-bold">Sending Alert...</h2>
                <p className="mt-2">Do not close this window.</p>
            </div>
        );
    }

    if (status === 'failed') {
        return (
            <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center p-6 text-white text-center z-50">
                <AlertTriangle className="w-24 h-24 text-red-500 mb-6" />
                <h2 className="text-3xl font-bold text-red-500">Alert Failed</h2>
                <p className="mt-2 text-xl">{errorMessage}</p>
                <div className="mt-8 bg-white/10 p-6 rounded-xl">
                    <p className="text-gray-400 text-sm uppercase tracking-widest mb-2">Call Security Directly</p>
                    <a href="tel:112" className="text-4xl font-black text-white flex items-center justify-center gap-3">
                        <Phone className="w-8 h-8" />
                        112
                    </a>
                </div>
                <button
                    onClick={() => setStatus('idle')}
                    className="mt-8 px-6 py-3 bg-gray-700 text-white rounded-lg font-bold hover:bg-gray-600"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col items-center">
            <header className="py-6 text-center w-full max-w-md">
                <div className="flex items-center justify-center gap-2 text-red-500 mb-2 animate-pulse">
                    <AlertTriangle className="w-8 h-8 fill-current" />
                    <span className="font-black text-3xl tracking-wider">EMERGENCY SOS</span>
                </div>
                <p className="text-gray-400 text-sm">Tap an option below to send an instant alert</p>
            </header>

            <div className="flex-1 grid grid-cols-1 gap-4 py-4 max-w-md w-full">
                <button
                    onClick={() => handleEmergency('Lift Stuck')}
                    className="group bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 active:scale-95 transition-all duration-200 rounded-2xl p-6 flex items-center justify-between shadow-lg shadow-red-900/40 border border-red-500/30"
                >
                    <div className="flex flex-col items-start">
                        <span className="text-2xl font-bold uppercase tracking-tight">Lift Stuck</span>
                        <span className="text-red-200 text-xs font-medium mt-1">Elevator failure / Trapped</span>
                    </div>
                    <div className="bg-white/20 p-3 rounded-xl group-hover:bg-white/30 transition-colors">
                        {/* Simple Lift Icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                    </div>
                </button>

                <button
                    onClick={() => handleEmergency('Fire')}
                    className="group bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 active:scale-95 transition-all duration-200 rounded-2xl p-6 flex items-center justify-between shadow-lg shadow-orange-900/40 border border-orange-500/30"
                >
                    <div className="flex flex-col items-start">
                        <span className="text-2xl font-bold uppercase tracking-tight">Fire</span>
                        <span className="text-orange-200 text-xs font-medium mt-1">Smoke / Flames</span>
                    </div>
                    <div className="bg-white/20 p-3 rounded-xl group-hover:bg-white/30 transition-colors">
                        <Flame className="w-8 h-8" />
                    </div>
                </button>

                <button
                    onClick={() => handleEmergency('Medical Emergency')}
                    className="group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 active:scale-95 transition-all duration-200 rounded-2xl p-6 flex items-center justify-between shadow-lg shadow-blue-900/40 border border-blue-500/30"
                >
                    <div className="flex flex-col items-start">
                        <span className="text-2xl font-bold uppercase text-left tracking-tight">Medical</span>
                        <span className="text-blue-200 text-xs font-medium mt-1">Injury / Health Issue</span>
                    </div>
                    <div className="bg-white/20 p-3 rounded-xl group-hover:bg-white/30 transition-colors">
                        <HeartPulse className="w-8 h-8" />
                    </div>
                </button>

                <button
                    onClick={() => handleEmergency('Electrical Hazard')}
                    className="group bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 active:scale-95 transition-all duration-200 rounded-2xl p-6 flex items-center justify-between shadow-lg shadow-yellow-900/40 border border-yellow-500/30"
                >
                    <div className="flex flex-col items-start">
                        <span className="text-2xl font-bold uppercase text-left tracking-tight">Electrical</span>
                        <span className="text-yellow-100 text-xs font-medium mt-1">Shock risk / Sparks</span>
                    </div>
                    <div className="bg-white/20 p-3 rounded-xl group-hover:bg-white/30 transition-colors">
                        <Zap className="w-8 h-8" />
                    </div>
                </button>

                <button
                    onClick={() => handleEmergency('Other')}
                    className="group bg-gray-800 hover:bg-gray-700 active:scale-95 transition-all duration-200 rounded-2xl p-6 flex items-center justify-between border border-gray-700"
                >
                    <div className="flex flex-col items-start">
                        <span className="text-2xl font-bold uppercase tracking-tight">Other</span>
                        <span className="text-gray-400 text-xs font-medium mt-1">Any other emergency</span>
                    </div>
                    <div className="bg-white/10 p-3 rounded-xl group-hover:bg-white/20 transition-colors">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                </button>
            </div>

            <footer className="py-6 text-center w-full">
                <div className="bg-gray-800/50 rounded-xl p-4 max-w-xs mx-auto backdrop-blur-sm border border-gray-700/50">
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-bold">Campus Security Direct Line</p>
                    <a href="tel:112" className="text-3xl font-black text-white flex items-center justify-center gap-3 hover:text-red-400 transition-colors">
                        <Phone className="w-6 h-6 fill-current" />
                        112 / 911
                    </a>
                </div>
            </footer>
        </div>
    );
};

export default EmergencySOS;
