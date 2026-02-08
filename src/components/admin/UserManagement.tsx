import { useState, useEffect } from 'react';
import { Search, Edit2, UserX, UserCheck } from 'lucide-react';
import api from '../../services/api';
import type { User } from '../../types';

interface UserManagementProps {
    role: 'student' | 'technician';
}

const UserManagement = ({ role }: UserManagementProps) => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);

    useEffect(() => {
        fetchUsers();
    }, [role]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/admin/users', { params: { role } });
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
        try {
            await api.patch(`/admin/users/${userId}/status`, { isActive: !currentStatus });
            setUsers(users.map(u => u.id === userId ? { ...u, isActive: !currentStatus } : u));
        } catch (error) {
            console.error('Failed to update status', error);
            alert('Failed to update status');
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        try {
            const response = await api.put(`/admin/users/${editingUser.id}`, editingUser);
            setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...response.data } : u));
            setEditingUser(null);
            alert('User updated successfully');
        } catch (error) {
            console.error('Failed to update user', error);
            alert('Failed to update user');
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.department?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) return <div className="text-center py-8">Loading {role}s...</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder={`Search ${role}s...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-field-light pl-10"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 font-semibold text-gray-700">Name</th>
                                <th className="px-6 py-3 font-semibold text-gray-700">Details</th>
                                <th className="px-6 py-3 font-semibold text-gray-700">Status</th>
                                <th className="px-6 py-3 font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{user.name}</p>
                                                <p className="text-gray-500 text-xs">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p>{user.phone || 'N/A'}</p>
                                        <p className="text-gray-500 text-xs">
                                            {role === 'technician' ?
                                                `${user.technician?.skillType} • ${user.technician?.assignedArea}` :
                                                user.department}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditingUser(user)}
                                                className="p-1 hover:bg-gray-200 rounded text-gray-600"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleToggleStatus(user.id, user.isActive || false)}
                                                className={`p-1 hover:bg-gray-200 rounded ${user.isActive ? 'text-red-600' : 'text-green-600'}`}
                                                title={user.isActive ? 'Deactivate' : 'Activate'}
                                            >
                                                {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
                        <h3 className="text-lg font-bold mb-4">Edit {role === 'student' ? 'Student' : 'Technician'}</h3>
                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input
                                    type="text"
                                    value={editingUser.name}
                                    onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                                    className="input-field-light"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Phone</label>
                                    <input
                                        type="text"
                                        value={editingUser.phone || ''}
                                        onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })}
                                        className="input-field-light"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Department</label>
                                    <input
                                        type="text"
                                        value={editingUser.department || ''}
                                        onChange={e => setEditingUser({ ...editingUser, department: e.target.value })}
                                        className="input-field-light"
                                        disabled={role === 'technician'}
                                    />
                                </div>
                            </div>

                            {role === 'technician' && editingUser.technician && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Skill Type</label>
                                        <input
                                            type="text"
                                            value={editingUser.technician.skillType}
                                            onChange={e => setEditingUser({
                                                ...editingUser,
                                                technician: { ...editingUser.technician!, skillType: e.target.value }
                                            })}
                                            className="input-field-light"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Assigned Area</label>
                                        <input
                                            type="text"
                                            value={editingUser.technician.assignedArea || ''}
                                            onChange={e => setEditingUser({
                                                ...editingUser,
                                                technician: { ...editingUser.technician!, assignedArea: e.target.value }
                                            })}
                                            className="input-field-light"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
