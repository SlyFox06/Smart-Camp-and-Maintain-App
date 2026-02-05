import { useState } from 'react';
import { X, MapPin, Calendar, User, Wrench, Clock, CheckCircle, Image as ImageIcon, AlertCircle, Edit, Save } from 'lucide-react';
import type { Complaint } from '../types';
import api from '../services/api';
import { formatDate, getTimeDifference, getStatusBadgeStyle, getSeverityBadgeStyle, formatResolutionTime, calculateResolutionTime } from '../utils/helpers';
import { currentUser } from '../data/mockData';

interface ComplaintDetailsProps {
    complaint: Complaint;
    onClose: () => void;
}

const ComplaintDetails = ({ complaint, onClose }: ComplaintDetailsProps) => {
    const [otpInput, setOtpInput] = useState('');
    const [otpError, setOtpError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    // Priority Editing
    const [isEditingPriority, setIsEditingPriority] = useState(false);
    const [newSeverity, setNewSeverity] = useState(complaint.severity);
    const isAdmin = currentUser.role === 'admin';

    const handleUpdatePriority = async () => {
        try {
            await api.patch(`/complaints/${complaint.id}/status`, {
                status: complaint.status, // Keep status same
                severity: newSeverity
            });
            alert('Priority updated successfully!');
            setIsEditingPriority(false);
            // Ideally trigger a refresh here, but for now we rely on the parent or close/reopen
            onClose(); // Close to refresh list in parent (not ideal but simple)
        } catch (error) {
            alert('Failed to update priority');
        }
    };

    const isStudent = currentUser.role === 'student';
    const canVerifyOTP = isStudent && complaint.status === 'resolved' && !complaint.otpVerified && complaint.otp;

    const handleOTPVerification = () => {
        setOtpError('');

        if (otpInput.length !== 4) {
            setOtpError('OTP must be 4 digits');
            return;
        }

        setIsVerifying(true);

        // Simulate OTP verification
        setTimeout(() => {
            if (otpInput === complaint.otp) {
                alert('✅ OTP Verified! Complaint has been closed successfully.');
                onClose();
            } else {
                setOtpError('Invalid OTP. Please try again.');
            }
            setIsVerifying(false);
        }, 1500);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="glass-card-light max-w-4xl w-full my-8">
                {/* Header */}
                <div className="sticky top-0 bg-white/95 backdrop-blur-lg p-6 border-b border-gray-200 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">{complaint.title}</h2>
                        <p className="text-sm text-gray-500">Complaint ID: {complaint.id}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-600" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Status and Severity */}
                    <div className="flex flex-wrap gap-3">
                        <span className={`status-badge ${getStatusBadgeStyle(complaint.status)} border`}>
                            {complaint.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <div className="flex items-center gap-2">
                            {isEditingPriority ? (
                                <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
                                    <select
                                        value={newSeverity}
                                        onChange={(e) => setNewSeverity(e.target.value as any)}
                                        className="text-sm border-none focus:ring-0 rounded bg-transparent py-1 pl-2 pr-8 cursor-pointer"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                    <button
                                        onClick={handleUpdatePriority}
                                        className="p-1 hover:bg-green-100 rounded text-green-600"
                                        title="Save"
                                    >
                                        <Save className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setIsEditingPriority(false)}
                                        className="p-1 hover:bg-red-100 rounded text-red-600"
                                        title="Cancel"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <span className={`status-badge ${getSeverityBadgeStyle(complaint.severity)} border flex items-center gap-2 pr-2`}>
                                    {complaint.severity.toUpperCase()} PRIORITY
                                    {isAdmin && (
                                        <button
                                            onClick={() => setIsEditingPriority(true)}
                                            className="hover:bg-black/10 rounded-full p-1 transition-colors"
                                            title="Edit Priority"
                                        >
                                            <Edit className="w-3 h-3" />
                                        </button>
                                    )}
                                </span>
                            )}
                        </div>
                        {complaint.otpVerified && (
                            <span className="status-badge bg-green-100 text-green-800 border border-green-200">
                                ✓ VERIFIED
                            </span>
                        )}
                    </div>

                    {/* Description */}
                    <div className="bg-gray-50 rounded-xl p-6">
                        <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                        <p className="text-gray-700">{complaint.description}</p>
                    </div>

                    {/* Images */}
                    {complaint.images && complaint.images.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <ImageIcon className="w-5 h-5" />
                                Attached Images
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {complaint.images.map((image, index) => (
                                    <img
                                        key={index}
                                        src={image}
                                        alt={`Evidence ${index + 1}`}
                                        className="w-full h-48 object-cover rounded-lg shadow-md hover:scale-105 transition-transform cursor-pointer"
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Asset Information */}
                    {complaint.asset && (
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Asset Information</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Asset Name</p>
                                    <p className="font-semibold text-gray-900">{complaint.asset.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Type</p>
                                    <p className="font-semibold text-gray-900">
                                        {complaint.asset.type.replace('_', ' ').toUpperCase()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Location</p>
                                    <p className="font-semibold text-gray-900">{complaint.asset.location}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Department</p>
                                    <p className="font-semibold text-gray-900">{complaint.asset.department}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* People Involved */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Student */}
                        {complaint.student && (
                            <div className="bg-white border border-gray-200 rounded-xl p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <User className="w-5 h-5 text-blue-500" />
                                    <h3 className="font-semibold text-gray-900">Reported By</h3>
                                </div>
                                <div className="flex items-center gap-3">
                                    <img
                                        src={complaint.student.avatar}
                                        alt={complaint.student.name}
                                        className="w-12 h-12 rounded-full"
                                    />
                                    <div>
                                        <p className="font-semibold text-gray-900">{complaint.student.name}</p>
                                        <p className="text-sm text-gray-600">{complaint.student.email}</p>
                                        <p className="text-sm text-gray-600">{complaint.student.department}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Technician */}
                        {complaint.technician && (
                            <div className="bg-white border border-gray-200 rounded-xl p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Wrench className="w-5 h-5 text-orange-500" />
                                    <h3 className="font-semibold text-gray-900">Assigned To</h3>
                                </div>
                                <div className="flex items-center gap-3">
                                    <img
                                        src={complaint.technician.avatar}
                                        alt={complaint.technician.name}
                                        className="w-12 h-12 rounded-full"
                                    />
                                    <div>
                                        <p className="font-semibold text-gray-900">{complaint.technician.name}</p>
                                        <p className="text-sm text-gray-600">{complaint.technician.email}</p>
                                        <p className="text-sm text-gray-600">
                                            Assigned {getTimeDifference(complaint.assignedAt!)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Timeline */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            Status Timeline
                        </h3>
                        <div className="space-y-4">
                            {complaint.statusHistory.map((update, index) => (
                                <div key={index} className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-3 h-3 rounded-full ${index === complaint.statusHistory.length - 1 ? 'bg-blue-500' : 'bg-gray-300'
                                            }`}></div>
                                        {index < complaint.statusHistory.length - 1 && (
                                            <div className="w-0.5 h-full bg-gray-300 my-1"></div>
                                        )}
                                    </div>
                                    <div className="flex-1 pb-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-sm font-semibold ${index === complaint.statusHistory.length - 1 ? 'text-blue-600' : 'text-gray-600'
                                                }`}>
                                                {update.status.replace('_', ' ').toUpperCase()}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {formatDate(update.timestamp)}
                                            </span>
                                        </div>
                                        {update.notes && (
                                            <p className="text-sm text-gray-600">{update.notes}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Location */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <MapPin className="w-5 h-5 text-red-500" />
                            <h3 className="font-semibold text-gray-900">Location</h3>
                        </div>
                        <p className="text-gray-700 mb-2">{complaint.location.address}</p>
                        <p className="text-sm text-gray-500">
                            📍 {complaint.location.latitude.toFixed(6)}, {complaint.location.longitude.toFixed(6)}
                        </p>
                    </div>

                    {/* OTP Verification (for students when complaint is resolved) */}
                    {canVerifyOTP && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                                <h3 className="font-semibold text-gray-900">Verify Complaint Resolution</h3>
                            </div>
                            <p className="text-gray-700 mb-4">
                                The technician has marked this complaint as resolved. Please enter the OTP provided by the technician to close this complaint.
                            </p>

                            {otpError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                    <p className="text-red-700 text-sm">{otpError}</p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={otpInput}
                                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                    placeholder="Enter 4-digit OTP"
                                    className="input-field-light flex-1"
                                    maxLength={4}
                                />
                                <button
                                    onClick={handleOTPVerification}
                                    disabled={isVerifying || otpInput.length !== 4}
                                    className="btn-success disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isVerifying ? 'Verifying...' : 'Verify & Close'}
                                </button>
                            </div>

                            <p className="text-xs text-gray-500 mt-2">
                                💡 Demo OTP: {complaint.otp}
                            </p>
                        </div>
                    )}

                    {/* Metrics */}
                    {complaint.resolvedAt && (
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                                <Calendar className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                                <p className="text-sm text-gray-600">Created</p>
                                <p className="font-semibold text-gray-900">{formatDate(complaint.createdAt)}</p>
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                                <p className="text-sm text-gray-600">Resolved</p>
                                <p className="font-semibold text-gray-900">{formatDate(complaint.resolvedAt)}</p>
                            </div>
                            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
                                <Clock className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                                <p className="text-sm text-gray-600">Resolution Time</p>
                                <p className="font-semibold text-gray-900">
                                    {formatResolutionTime(calculateResolutionTime(complaint.createdAt, complaint.resolvedAt))}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ComplaintDetails;
