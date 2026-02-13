import { useState } from 'react';
import { QrCode as QrIcon, Printer, AlertTriangle, UserX, Users } from 'lucide-react';
import QRCode from 'react-qr-code';

const EmergencyManagement = () => {
    const [showQRModal, setShowQRModal] = useState(false);

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-red-100 shadow-sm">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                            Emergency Response System
                        </h3>
                        <p className="text-gray-500 text-sm mt-1">Manage emergency protocols and generate SOS points.</p>
                    </div>
                    <button
                        onClick={() => setShowQRModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-bold shadow-lg shadow-red-200 transform hover:-translate-y-1"
                    >
                        <QrIcon className="w-5 h-5" />
                        Generate Emergency QR
                    </button>
                </div>

                <div className="mt-8 grid md:grid-cols-3 gap-6">
                    <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                        <h4 className="font-bold text-red-800 mb-2">Active Protocols</h4>
                        <p className="text-sm text-red-600">Standard emergency response protocols are active. Admins will be notified instantly via dashboard and audit logs.</p>
                    </div>
                </div>
            </div>

            {/* QR Code Modal */}
            {showQRModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 transform scale-100 transition-all">
                        <div className="bg-gradient-to-r from-red-600 to-red-700 p-8 text-white text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                            <AlertTriangle className="w-16 h-16 mx-auto mb-4 animate-bounce" />
                            <h2 className="text-3xl font-black uppercase tracking-widest text-white drop-shadow-md">Emergency SOS</h2>
                            <p className="text-red-100 font-medium mt-2">Scan for Instant Help</p>
                            <button
                                onClick={() => setShowQRModal(false)}
                                className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/20 hover:bg-white/30 p-2 rounded-full transition-all"
                            >
                                <UserX className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        <div className="p-10 flex flex-col items-center bg-gray-50">
                            <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-gray-200 mb-6">
                                <QRCode
                                    value={`${window.location.origin}/sos`}
                                    size={250}
                                    level="H"
                                    fgColor="#DC2626"
                                />
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 w-full mb-6">
                                <div className="flex items-start gap-3">
                                    <div className="bg-blue-100 p-2 rounded-full">
                                        <Users className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800">Placement Instructions</h4>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Place this QR code in high-traffic areas, laboratories, elevators, and cleaning supply rooms.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => window.print()}
                                className="w-full bg-gray-900 hover:bg-gray-800 text-white py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1"
                            >
                                <Printer className="w-6 h-6" />
                                Print SOS Poster
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmergencyManagement;
