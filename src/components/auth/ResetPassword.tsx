
import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../../services/api';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setStatus('error');
            setMessage('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setStatus('error');
            setMessage('Password must be at least 6 characters');
            return;
        }

        setStatus('loading');
        try {
            await api.post('/auth/reset-password', { token, newPassword: password });
            setStatus('success');
            setTimeout(() => navigate('/login'), 3000);
        } catch (error: any) {
            setStatus('error');
            setMessage(error.response?.data?.message || 'Failed to reset password. Link may be expired.');
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
                    <h2 className="text-xl font-bold text-red-600 mb-4">Invalid Link</h2>
                    <p className="text-gray-600 mb-6">This password reset link is invalid or missing a token.</p>
                    <Link to="/login" className="btn-primary inline-flex items-center">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
                        <p className="text-gray-600 mt-2">Enter your new password below</p>
                    </div>

                    {status === 'success' ? (
                        <div className="text-center space-y-4">
                            <div className="flex justify-center">
                                <CheckCircle className="w-16 h-16 text-green-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900">Password Reset!</h3>
                            <p className="text-gray-600">You will be redirected to login shortly...</p>
                            <Link to="/login" className="btn-primary w-full inline-block">
                                Login Now
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {status === 'error' && (
                                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                                    {message}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="input-field pl-10 w-full"
                                        placeholder="••••••"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="input-field pl-10 w-full"
                                        placeholder="••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full btn-primary py-3 flex justify-center"
                            >
                                {status === 'loading' ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
