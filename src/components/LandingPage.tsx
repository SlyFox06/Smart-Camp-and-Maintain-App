import { QrCode, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useEffect } from 'react';

const LandingPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();

    useEffect(() => {
        if (isAuthenticated && user) {
            navigate(`/${user.role}`, { replace: true });
        }
    }, [isAuthenticated, user, navigate]);

    const stats = [
        { icon: QrCode, label: 'QR-Based Reporting', value: 'Instant' },
        { icon: TrendingUp, label: 'Resolution Rate', value: '95%' },
        { icon: Clock, label: 'Avg Response Time', value: '2 hrs' },
        { icon: CheckCircle, label: 'Complaints Resolved', value: '1000+' }
    ];

    const handleLogin = () => {
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative z-10 container mx-auto px-4 py-12">
                {/* Header */}
                <div className="text-center mb-16 animate-fade-in">
                    <div className="flex items-center justify-center mb-6">
                        <div className="p-4 bg-white/20 backdrop-blur-lg rounded-2xl">
                            <QrCode className="w-16 h-16 text-white" />
                        </div>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 animate-slide-up">
                        Smart Campus Maintenance
                    </h1>
                    <p className="text-xl md:text-2xl text-white/90 mb-2">
                        AI-Powered Complaint Management System
                    </p>
                    <p className="text-lg text-white/70 max-w-2xl mx-auto">
                        Scan QR codes, report issues instantly, and track maintenance in real-time
                    </p>
                    <div className="mt-8">
                        <button
                            onClick={handleLogin}
                            className="bg-white text-indigo-600 px-10 py-4 rounded-full font-bold text-xl hover:bg-indigo-50 transition-all transform hover:scale-105 shadow-xl"
                        >
                            Login to Portal
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    {stats.map((stat, index) => (
                        <div key={index} className="glass-card p-6 text-center card-hover">
                            <stat.icon className="w-8 h-8 text-white mx-auto mb-3" />
                            <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                            <div className="text-sm text-white/70">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Features Section */}
                <div className="mt-20 glass-card p-8 md:p-12">
                    <h2 className="text-3xl font-bold text-white text-center mb-12">Key Features</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <QrCode className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">QR Code Integration</h3>
                            <p className="text-white/70">
                                Scan asset QR codes for instant complaint registration with auto-filled details
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <TrendingUp className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">AI-Powered Analytics</h3>
                            <p className="text-white/70">
                                Smart severity classification and predictive maintenance insights
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">OTP Verification</h3>
                            <p className="text-white/70">
                                Secure complaint closure with student verification via OTP
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
