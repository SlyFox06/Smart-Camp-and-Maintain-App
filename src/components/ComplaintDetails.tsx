import { useState } from 'react';
import { X, MapPin, Calendar, User, Wrench, Clock, CheckCircle, Image as ImageIcon, AlertCircle, Edit, Save, Star } from 'lucide-react';
import StatusTimeline from './StatusTimeline';
import type { Complaint } from '../types';
import api from '../services/api';
import { formatDate, getTimeDifference, formatResolutionTime, calculateResolutionTime } from '../utils/helpers';
import { useAuth } from '../hooks/useAuth';


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
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const isStudent = user?.role === 'student';
    const isTechnician = user?.role === 'technician'; // Add technician check

    // Work Submission (Technician)
    // Work Submission (Technician)
    const [proofImage, setProofImage] = useState<string>('');
    const [workNote, setWorkNote] = useState('');

    // Feedback (Student)
    const [rating, setRating] = useState(0);
    const [feedbackText, setFeedbackText] = useState('');

    // Admin Review (Already has general logic, adapting)
    const [adminComment, setAdminComment] = useState('');


    // Safe Data Handling
    const statusHistory = complaint.statusHistory || [];
    const rawImages = complaint.images as any;
    const images = (() => {
        if (Array.isArray(rawImages)) return rawImages;
        if (typeof rawImages === 'string') {
            try {
                const parsed = JSON.parse(rawImages);
                if (Array.isArray(parsed)) return parsed;
                return [rawImages];
            } catch {
                return rawImages.length > 0 ? [rawImages] : [];
            }
        }
        return [];
    })();

    // Approval Logic
    const [isProcessing, setIsProcessing] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectInput, setShowRejectInput] = useState(false);

    const handleApproval = async (action: 'accept' | 'reject') => {
        if (action === 'reject' && !rejectionReason && !showRejectInput) {
            setShowRejectInput(true);
            return;
        }

        if (action === 'reject' && !rejectionReason) {
            alert('Please provide a reason for rejection.');
            return;
        }

        setIsProcessing(true);
        try {
            const response = await api.post(`/complaints/${complaint.id}/approval`, {
                action,
                notes: rejectionReason
            });

            const message = response.data.message || `Complaint ${action === 'accept' ? 'Approved' : 'Rejected'} Successfully`;
            alert(message);
            onClose();
        } catch (error: any) {
            console.error(error);
            const errorMessage = error.response?.data?.message || 'Action failed';
            alert(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

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

    // New Handlers
    const submitWork = async () => {
        if (!proofImage) return alert('Please upload a proof image');
        try {
            await api.post(`/complaints/${complaint.id}/work-submit`, { proof: [proofImage], note: workNote });
            alert('Work submitted successfully');
            onClose();
        } catch (e) { console.error(e); alert('Failed to submit work'); }
    };

    const reviewWork = async (action: 'approve' | 'reject') => {
        if (action === 'reject' && !adminComment) return alert('Comment required for rejection');
        try {
            await api.post(`/complaints/${complaint.id}/work-review`, { action, comment: adminComment });
            alert(`Work ${action}d`);
            onClose();
        } catch (e) { console.error(e); alert('Review failed'); }
    };

    const submitFeedback = async () => {
        if (rating === 0) return alert('Please select a rating');
        try {
            await api.post(`/complaints/${complaint.id}/feedback`, { rating, feedback: feedbackText });
            alert('bFeedback submitted & Complaint Closed');
            onClose();
        } catch (e) { console.error(e); alert('Failed to submit feedback'); }
    };

    // Helper for Work Proof Images
    const workProofImages = (() => {
        if (!complaint.workProof) return [];
        try { return JSON.parse(complaint.workProof); } catch { return [complaint.workProof]; }
    })();


    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full my-8 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white p-6 border-b border-gray-200 flex items-start justify-between z-10 rounded-t-2xl">
                    <div className="flex-1">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">{complaint.title}</h2>
                        <p className="text-sm text-gray-500">ID: {complaint.id}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Status and Severity */}
                    <div className="flex flex-wrap gap-3">
                        <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg ${complaint.status === 'reported' ? 'bg-blue-500 text-white' :
                            complaint.status === 'assigned' ? 'bg-yellow-500 text-white' :
                                complaint.status === 'in_progress' ? 'bg-orange-500 text-white' :
                                    complaint.status === 'resolved' ? 'bg-green-500 text-white' :
                                        complaint.status === 'rejected' ? 'bg-red-600 text-white' :
                                            'bg-gray-500 text-white'
                            }`}>
                            {complaint.status.replace(/_/g, ' ').toUpperCase()}
                        </span>

                        {/* Timeline */}
                        <div className="w-full mt-6 mb-4">
                            <StatusTimeline status={complaint.status} />
                        </div>

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
                                <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 ${complaint.severity === 'low' ? 'bg-green-500 text-white' :
                                    complaint.severity === 'medium' ? 'bg-yellow-500 text-white' :
                                        complaint.severity === 'high' ? 'bg-orange-500 text-white' :
                                            'bg-red-600 text-white'
                                    }`}>
                                    {complaint.severity.toUpperCase()} PRIORITY
                                    {isAdmin && (
                                        <button
                                            onClick={() => setIsEditingPriority(true)}
                                            className="hover:bg-white/20 rounded-full p-1 transition-colors"
                                            title="Edit Priority"
                                        >
                                            <Edit className="w-3 h-3" />
                                        </button>
                                    )}
                                </span>
                            )}
                        </div>
                        {complaint.otpVerified && (
                            <span className="px-4 py-2 rounded-full text-sm font-bold bg-green-500 text-white shadow-lg">
                                ✓ VERIFIED
                            </span>
                        )}
                    </div>

                    {/* Admin Approval Section - ONLY for REPORTED status */}
                    {isAdmin && complaint.status === 'reported' && (
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-6">
                            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-orange-600" />
                                Admin Action Required
                            </h3>
                            <p className="text-gray-700 mb-4">
                                This complaint is pending approval. Please review the details and take action.
                            </p>

                            {showRejectInput && (
                                <textarea
                                    className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-red-500 outline-none"
                                    placeholder="Enter reason for rejection..."
                                    rows={3}
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                ></textarea>
                            )}

                            <div className="flex gap-4">
                                {!showRejectInput && (
                                    <button
                                        onClick={() => handleApproval('accept')}
                                        disabled={isProcessing}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                        Approve & Auto-Assign
                                    </button>
                                )}

                                <button
                                    onClick={() => handleApproval('reject')}
                                    disabled={isProcessing}
                                    className={`flex-1 ${showRejectInput ? 'w-full' : ''} bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors`}
                                >
                                    <X className="w-5 h-5" />
                                    {showRejectInput ? 'Confirm Rejection' : 'Reject Complaint'}
                                </button>

                                {showRejectInput && (
                                    <button
                                        onClick={() => setShowRejectInput(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 font-medium"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <h3 className="font-bold text-gray-900 mb-3 text-lg">Description</h3>
                        <p className="text-gray-700 leading-relaxed text-base">{complaint.description}</p>
                    </div>

                    {/* Images */}
                    {images.length > 0 && (
                        <div className="bg-white rounded-xl p-6 border-2 border-purple-200">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                                <ImageIcon className="w-5 h-5 text-purple-600" />
                                Attached Images ({images.length})
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {images.map((image, index) => (
                                    <img
                                        key={index}
                                        src={image}
                                        alt={`Evidence ${index + 1}`}
                                        className="w-full h-48 object-cover rounded-lg shadow-lg hover:scale-105 transition-transform cursor-pointer border-2 border-gray-200"
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Asset Information */}
                    {complaint.asset && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                            <h3 className="font-bold text-gray-900 mb-4 text-lg">Asset Information</h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Asset Name</p>
                                    <p className="font-bold text-gray-900 text-lg">{complaint.asset.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Type</p>
                                    <p className="font-bold text-gray-900 text-lg">
                                        {complaint.asset.type.replace('_', ' ').toUpperCase()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Location</p>
                                    <p className="font-bold text-gray-900 text-lg">
                                        {complaint.asset.building}, Floor {complaint.asset.floor}, Room {complaint.asset.room}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Department</p>
                                    <p className="font-bold text-gray-900 text-lg">{complaint.asset.department}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* People Involved */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Student */}
                        {complaint.student && (
                            <div className="bg-white border-2 border-blue-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <User className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-lg">Reported By</h3>
                                </div>
                                <div className="flex items-center gap-3">
                                    <img
                                        src={complaint.student.avatar}
                                        alt={complaint.student.name}
                                        className="w-16 h-16 rounded-full border-2 border-blue-200"
                                    />
                                    <div>
                                        <p className="font-bold text-gray-900 text-lg">{complaint.student.name}</p>
                                        <p className="text-sm text-gray-600">{complaint.student.email}</p>
                                        <p className="text-sm text-gray-600">{complaint.student.department}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Technician */}
                        {complaint.technician && (
                            <div className="bg-white border-2 border-orange-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-2 bg-orange-100 rounded-lg">
                                        <Wrench className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-lg">Assigned To</h3>
                                </div>
                                <div className="flex items-center gap-3">
                                    <img
                                        src={complaint.technician.avatar}
                                        alt={complaint.technician.name}
                                        className="w-16 h-16 rounded-full border-2 border-orange-200"
                                    />
                                    <div>
                                        <p className="font-bold text-gray-900 text-lg">{complaint.technician.name}</p>
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
                            {statusHistory.map((update, index) => (
                                <div key={index} className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-3 h-3 rounded-full ${index === statusHistory.length - 1 ? 'bg-blue-500' : 'bg-gray-300'
                                            }`}></div>
                                        {index < statusHistory.length - 1 && (
                                            <div className="w-0.5 h-full bg-gray-300 my-1"></div>
                                        )}
                                    </div>
                                    <div className="flex-1 pb-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-sm font-semibold ${index === statusHistory.length - 1 ? 'text-blue-600' : 'text-gray-600'
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

                    {/* NEW: Technician Work Submission */}
                    {isTechnician && (['assigned', 'in_progress', 'rework_required'].includes(complaint.status)) && (
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Wrench className="w-5 h-5 text-orange-600" />
                                Submit Work Completion
                            </h3>
                            {complaint.status === 'rework_required' && (
                                <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
                                    <strong>Rework Required:</strong> {complaint.adminComment}
                                </div>
                            )}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Proof Image (Max 5MB)</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="w-full p-2 border rounded bg-white"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setProofImage(reader.result as string);
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                    {proofImage && (
                                        <img src={proofImage} alt="Proof Preview" className="mt-2 h-32 rounded border bg-white" />
                                    )}
                                </div>
                                <textarea
                                    placeholder="Work Notes..."
                                    className="w-full p-2 border rounded"
                                    value={workNote}
                                    onChange={e => setWorkNote(e.target.value)}
                                />
                                <button onClick={submitWork} className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 w-full font-semibold shadow-md">
                                    Submit Work
                                </button>
                            </div>
                        </div>
                    )}

                    {/* NEW: Admin Work Review */}
                    {isAdmin && complaint.status === 'work_submitted' && (
                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                            <h3 className="font-bold text-gray-900 mb-4">Review Work</h3>
                            <div className="mb-4">
                                <p className="font-semibold">Technician Note:</p>
                                <p className="text-gray-700 italic">{complaint.workNote || 'No notes'}</p>
                            </div>
                            {workProofImages.length > 0 && (
                                <div className="mb-4">
                                    <p className="font-semibold mb-2">Proof:</p>
                                    <img src={workProofImages[0]} alt="Work Proof" className="h-40 rounded border" />
                                </div>
                            )}
                            <div className="space-y-3">
                                <textarea
                                    placeholder="Admin Comment (Required for rejection)"
                                    className="w-full p-2 border rounded"
                                    value={adminComment}
                                    onChange={e => setAdminComment(e.target.value)}
                                />
                                <div className="flex gap-4">
                                    <button onClick={() => reviewWork('approve')} className="flex-1 bg-green-600 text-white py-2 rounded">Approve</button>
                                    <button onClick={() => reviewWork('reject')} className="flex-1 bg-red-600 text-white py-2 rounded">Reject</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* NEW: Student Feedback */}
                    {isStudent && (complaint.status === 'work_approved' || complaint.status === 'feedback_pending') && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                            <h3 className="font-bold text-gray-900 mb-2">Work Completed!</h3>
                            <p className="mb-4 text-sm text-gray-600">The admin has approved the work. Please rate the service to close the complaint.</p>
                            <div className="flex justify-center gap-2 mb-4">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`w-8 h-8 cursor-pointer ${star <= rating ? 'fill-yellow-400 text-yellow-500' : 'text-gray-300'}`}
                                        onClick={() => setRating(star)}
                                    />
                                ))}
                            </div>
                            <textarea
                                placeholder="Any feedback? (Optional)"
                                className="w-full p-2 border rounded mb-4"
                                value={feedbackText}
                                onChange={e => setFeedbackText(e.target.value)}
                            />
                            <button onClick={submitFeedback} className="bg-green-600 text-white px-6 py-2 rounded-full font-bold hover:bg-green-700">
                                Submit Feedback & Close
                            </button>
                        </div>
                    )}

                    {complaint.asset && (
                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-3">
                                <MapPin className="w-5 h-5 text-red-500" />
                                <h3 className="font-semibold text-gray-900">Location</h3>
                            </div>
                            <p className="text-gray-700 mb-2">
                                {complaint.asset.building}, Floor {complaint.asset.floor}, {complaint.asset.room}
                            </p>
                            <p className="text-sm text-gray-500">
                                Department: {complaint.asset.department}
                            </p>
                        </div>
                    )}

                    {/* OTP Verification (for students when complaint is resolved) */}
                    {canVerifyOTP && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
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
        </div >
    );
};

export default ComplaintDetails;
