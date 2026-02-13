import React, { useState } from 'react';
import { Lock, Check, Loader2, ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const ForcePasswordChange = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth(); // Assuming we re-login or update user state
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            await api.post('/auth/change-password', { newPassword: password });

            // Password changed successfully. Redirect to dashboard.
            // Ideally update local user state to remove flag
            const updatedUser = { ...user!, requiresPasswordChange: false };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            navigate(`/${updatedUser.role}`, { replace: true });

            // Force reload to update context if needed or rely on navigation
            window.location.reload();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to change password');
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-amber-500 p-6 text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <ShieldCheck className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-1">Security Update Required</h2>
                    <p className="text-amber-100 text-sm">Please change your temporary password</p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none"
                                        placeholder="Min. 6 characters"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 outline-none"
                                        placeholder="Confirm password"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-amber-500/30"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <Check className="w-5 h-5" />
                                    Update Password & Login
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
