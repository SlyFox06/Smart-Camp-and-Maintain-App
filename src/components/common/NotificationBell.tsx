import { useState, useRef, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDate } from '../../utils/helpers';

const NotificationBell = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = (notification: any) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }

        // Navigate if related complaint
        if (notification.relatedComplaintId) {
            // Determine user role logic or allow component to handle navigation path
            // Assuming simpler direct navigation or filtering
            // If we are in student view, maybe just open details? 
            // Ideally we navigate to a route that handles opening the details.
            // But for now, let's just create a query param or handle it in the dashboard.

            // Simplest approach: Use state passing or just navigate to dashboard with query
            // But dashboards are protected. Assuming we are on a dashboard.
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full bg-white hover:bg-gray-100 text-gray-600 hover:text-blue-600 transition-colors border border-gray-200 shadow-sm"
                title="Notifications"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="fixed top-24 left-4 right-4 md:absolute md:top-full md:left-auto md:right-0 md:w-96 bg-white rounded-xl shadow-2xl overflow-hidden z-[100] border border-gray-100 animation-fade-in-up">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                        <h3 className="font-semibold text-gray-800">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllAsRead()}
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                            >
                                <Check className="w-3 h-3" /> Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p>No notifications</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.read ? 'bg-indigo-50/50 border-l-4 border-indigo-500' : ''}`}
                                    >
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex-1">
                                                <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-2">
                                                    {formatDate(new Date(notification.createdAt))}
                                                </p>
                                            </div>
                                            {!notification.read && (
                                                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1 flex-shrink-0"></div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
