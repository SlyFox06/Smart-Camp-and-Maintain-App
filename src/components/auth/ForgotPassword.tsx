
import { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        try {
            await api.post('/auth/forgot-password', { email });
            setStatus('success');
            setMessage('If an account exists with this email, you will receive a password reset link shortly.');
        } catch (error: any) {
            setStatus('error');
            setMessage(error.response?.data?.message || 'Failed to send reset email. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">Forgot Password</h2>
                        <p className="text-gray-600 mt-2">Enter your email to receive a reset link</p>
                    </div>

                    {status === 'success' ? (
                        <div className="text-center space-y-4">
                            <div className="bg-green-50 text-green-700 p-4 rounded-lg">
                                {message}
                            </div>
                            <Link to="/login" className="inline-block text-indigo-600 hover:text-indigo-700 font-medium">
                                Back to Login
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
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="input-field pl-10 w-full"
                                        placeholder="you@campus.edu"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="w-full btn-primary py-3 flex justify-center"
                            >
                                {status === 'loading' ? 'Sending Link...' : 'Send Reset Link'}
                            </button>

                            <div className="text-center">
                                <Link to="/login" className="inline-flex items-center text-sm text-gray-600 hover:text-indigo-600">
                                    <ArrowLeft className="w-4 h-4 mr-1" />
                                    Back to Login
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
