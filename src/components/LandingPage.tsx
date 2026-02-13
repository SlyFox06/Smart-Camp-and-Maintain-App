import { QrCode, TrendingUp, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-12 pt-8">
                    <div className="flex items-center justify-center mb-6">
                        <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg">
                            <QrCode className="w-12 h-12 text-white" />
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
                        Smart Campus Maintenance
                    </h1>
                    <p className="text-xl text-gray-700 mb-2">
                        AI-Powered Complaint Management System
                    </p>
                    <p className="text-base text-gray-600 max-w-2xl mx-auto mb-8">
                        Scan QR codes, report issues instantly, and track maintenance in real-time
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                        <button
                            onClick={handleLogin}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-indigo-700 transition-colors shadow-md"
                        >
                            Login to Portal
                        </button>

                        <button
                            onClick={() => navigate('/sos')}
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors shadow-md"
                        >
                            <AlertTriangle className="w-5 h-5" />
                            Emergency SOS
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-5xl mx-auto">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-white rounded-xl p-6 text-center shadow-md hover:shadow-lg transition-shadow">
                            <stat.icon className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
                            <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                            <div className="text-sm text-gray-600">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Features Section */}
                <div className="mt-12 bg-white rounded-2xl p-8 md:p-12 shadow-lg max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">Key Features</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <QrCode className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">QR Code Integration</h3>
                            <p className="text-gray-600">
                                Scan asset QR codes for instant complaint registration with auto-filled details
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <TrendingUp className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">AI-Powered Analytics</h3>
                            <p className="text-gray-600">
                                Smart severity classification and predictive maintenance insights
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-orange-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">OTP Verification</h3>
                            <p className="text-gray-600">
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
