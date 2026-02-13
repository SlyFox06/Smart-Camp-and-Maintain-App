import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LogIn, User, Lock, ArrowRight, Loader } from 'lucide-react';
import { useEffect } from 'react';
import { ForcePasswordChange } from './ForcePasswordChange';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login, isAuthenticated, user: loggedInUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (isAuthenticated && loggedInUser) {
            navigate(`/${loggedInUser.role}`, { replace: true });
        }
    }, [isAuthenticated, loggedInUser, navigate]);

    const [showForceChange, setShowForceChange] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const user = await login(email.trim(), password);

            if (user.requiresPasswordChange) {
                setShowForceChange(true);
                return;
            }

            const from = location.state?.from?.pathname;
            if (from) {
                navigate(from, { replace: true });
            } else {
                if (user.role === 'student') {
                    if (user.accessScope === 'hostel') {
                        navigate('/hostel-student', { replace: true });
                    } else if (user.accessScope === 'both') {
                        // Start with college by default, but StudentDashboard should have a switcher
                        navigate('/student', { replace: true });
                    } else {
                        navigate('/student', { replace: true });
                    }
                } else {
                    navigate(`/${user.role}`, { replace: true });
                }
            }

        } catch (err: any) {
            setError(err.message || 'Invalid email or password');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (showForceChange) {
        return <div className="min-h-screen bg-slate-50"><ForcePasswordChange /></div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-blue-600 p-8 text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <LogIn className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                    <p className="text-blue-100">Sign in to Smart Campus Maintenance</p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 block">Email Address</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 block">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" />
                                <span className="text-gray-600">Remember me</span>
                            </label>
                            <Link to="/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium">Forgot Password?</Link>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin" />
                                    Signing In...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-semibold">
                            Sign up as Student
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
