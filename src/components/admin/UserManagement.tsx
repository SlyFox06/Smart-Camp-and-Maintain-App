import { useState, useEffect } from 'react';
import { Search, Edit2, UserX, UserCheck, Plus } from 'lucide-react';
import api from '../../services/api';
import type { User } from '../../types';

interface UserManagementProps {
    role: 'student' | 'technician' | 'warden' | 'cleaner';
    scope?: 'college' | 'hostel';
}

const UserManagement = ({ role, scope }: UserManagementProps) => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newUser, setNewUser] = useState<{
        name: string;
        email: string;
        phone: string;
        department: string;
        skillType: string;
        assignedArea: string;
        accessScope: 'college' | 'hostel' | 'both';
    }>({
        name: '',
        email: '',
        phone: '',
        department: '',
        skillType: role === 'cleaner' ? 'Cleaner' : '',
        assignedArea: '',
        accessScope: scope || 'college'
    });

    useEffect(() => {
        fetchUsers();
    }, [role, scope]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const params: any = { role };
            if (scope) params.scope = scope;
            const response = await api.get('/admin/users', { params });
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

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let response;
            if (role === 'technician') {
                response = await api.post('/auth/technicians', {
                    name: newUser.name,
                    email: newUser.email,
                    phone: newUser.phone,
                    skillType: newUser.skillType,
                    assignedArea: newUser.assignedArea,
                    password: (newUser as any).password,
                    accessScope: newUser.accessScope
                });
            } else if (role === 'cleaner') {
                response = await api.post('/auth/cleaners', {
                    name: newUser.name,
                    email: newUser.email,
                    phone: newUser.phone,
                    assignedArea: newUser.assignedArea,
                    password: (newUser as any).password,
                    accessScope: newUser.accessScope
                });
            } else {
                response = await api.post('/auth/users', {
                    name: newUser.name,
                    email: newUser.email,
                    phone: newUser.phone,
                    department: role === 'warden' ? 'Hostel Administration' : newUser.department,
                    role: role,
                    accessScope: role === 'warden' ? 'hostel' : newUser.accessScope,
                    password: (newUser as any).password
                });
            }

            // Backend now sends email with auto-generated credentials
            alert(`User created successfully! Login credentials have been sent to ${newUser.email}`);
            setUsers([...users, response.data.technician || response.data.cleaner || response.data.user || response.data]);
            setIsAddModalOpen(false);
            setNewUser({ name: '', email: '', phone: '', department: '', skillType: role === 'cleaner' ? 'Cleaner' : '', assignedArea: '', accessScope: scope || 'college' });
            fetchUsers(); // Refresh list to get full data
        } catch (error: any) {
            console.error('Failed to create user', error);
            alert(error.response?.data?.message || 'Failed to create user');
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
                <div className="relative w-80 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder={`Search ${role}s...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Add {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
                            <tr>
                                <th className="px-6 py-4 font-semibold tracking-wide uppercase text-xs">Name</th>
                                <th className="px-6 py-4 font-semibold tracking-wide uppercase text-xs">Details</th>
                                <th className="px-6 py-4 font-semibold tracking-wide uppercase text-xs">Status</th>
                                <th className="px-6 py-4 font-semibold tracking-wide uppercase text-xs">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredUsers.map((user, index) => (
                                <tr
                                    key={user.id}
                                    className={`transition-all duration-200 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                                >
                                    <td className="px-6 py-4 text-gray-800">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                                <span>{user.name.charAt(0)}</span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{user.name}</p>
                                                <p className="text-gray-500 text-xs">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        <p className="text-gray-800">{user.phone || 'N/A'}</p>
                                        <p className="text-gray-500 text-xs mt-1 font-mono tracking-wider">
                                            {role === 'technician' ?
                                                `Skill: ${user.technician?.skillType} • Area: ${user.technician?.assignedArea}` :
                                                role === 'cleaner' ?
                                                    `Area: ${user.cleaner?.assignedArea}` :
                                                    user.department}
                                        </p>
                                        {user.accessScope && (
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 uppercase tracking-wide ${user.accessScope === 'both' ? 'bg-purple-100 text-purple-700' :
                                                user.accessScope === 'hostel' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                {user.accessScope}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {(() => {
                                            if (!user.isActive) {
                                                return (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">
                                                        Inactive
                                                    </span>
                                                );
                                            }
                                            if (role === 'technician' && user.technician && !user.technician.isAvailable) {
                                                return (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">
                                                        Unavailable
                                                    </span>
                                                );
                                            }
                                            if (role === 'cleaner' && user.cleaner && !user.cleaner.isAvailable) {
                                                return (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">
                                                        Unavailable
                                                    </span>
                                                );
                                            }
                                            return (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                                                    Active
                                                </span>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setEditingUser(user)}
                                                className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleToggleStatus(user.id, user.isActive || false)}
                                                className={`p-2 rounded-lg border transition-colors ${user.isActive
                                                    ? 'text-red-600 hover:bg-red-50 border-transparent hover:border-red-200'
                                                    : 'text-green-600 hover:bg-green-50 border-transparent hover:border-green-200'}`}
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

            {/* Add User Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
                        <h3 className="text-lg font-bold mb-4 text-gray-900">Add New {role.charAt(0).toUpperCase() + role.slice(1)}</h3>
                        <form onSubmit={handleAddUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newUser.name}
                                    onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                    className="input-field-light"
                                    placeholder="Full Name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={newUser.email}
                                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                    className="input-field-light"
                                    placeholder="email@campus.edu"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Phone</label>
                                    <input
                                        type="tel"
                                        value={newUser.phone}
                                        onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
                                        className="input-field-light"
                                        placeholder="Optional"
                                    />
                                </div>
                                {role === 'student' ? (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-gray-700">Department</label>
                                            <input
                                                type="text"
                                                required
                                                value={newUser.department}
                                                onChange={e => setNewUser({ ...newUser, department: e.target.value })}
                                                className="input-field-light"
                                                placeholder="e.g. CS, EE"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-700">Skill Type</label>
                                        <select
                                            required
                                            value={newUser.skillType}
                                            onChange={e => setNewUser({ ...newUser, skillType: e.target.value })}
                                            className="input-field-light"
                                        >
                                            {role === 'technician' ? (
                                                <>
                                                    <option value="">Select Skill</option>
                                                    <option value="Electrician">Electrician</option>
                                                    <option value="Plumber">Plumber</option>
                                                    <option value="Maintenance Technician">Maintenance Technician</option>
                                                    <option value="IT Technician">IT Technician</option>
                                                </>
                                            ) : (
                                                <option value="Cleaner">Cleaner</option>
                                            )}
                                        </select>
                                    </div>
                                )}
                                {(role !== 'warden') && !scope && (
                                    <div className={`${role === 'student' ? '' : 'col-span-2'}`}>
                                        <label className="block text-sm font-medium mb-1 text-gray-700">Access Scope</label>
                                        <select
                                            value={newUser.accessScope}
                                            onChange={e => setNewUser({ ...newUser, accessScope: e.target.value as any })}
                                            className="input-field-light"
                                        >
                                            <option value="college">College Only</option>
                                            <option value="hostel">Hostel Only</option>
                                            <option value="both">Both (College & Hostel)</option>
                                        </select>
                                    </div>
                                )}
                                {role === 'cleaner' && (
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium mb-1 text-gray-700">
                                            {newUser.accessScope === 'hostel' ? 'Assigned Hostel Block' :
                                                newUser.accessScope === 'college' ? 'Assigned College Building' :
                                                    'Assigned Area (Block/Building)'}
                                        </label>
                                        <input
                                            type="text"
                                            value={newUser.assignedArea}
                                            onChange={e => setNewUser({ ...newUser, assignedArea: e.target.value })}
                                            className="input-field-light"
                                            placeholder={newUser.accessScope === 'hostel' ? "e.g. Block A" : "e.g. Science Building"}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            {newUser.accessScope === 'hostel' ?
                                                'Enter the specific hostel block this cleaner is responsible for.' :
                                                'Enter the specific building or department area.'}
                                        </p>
                                    </div>
                                )}
                            </div>
                            {role === 'warden' && (
                                <div className="mt-4">
                                    <p className="text-sm text-gray-500 italic">
                                        Wardens are automatically assigned to the "Hostel Administration" department and "Hostel" access scope.
                                    </p>
                                </div>
                            )}

                            {role === 'technician' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Assigned Area</label>
                                    <input
                                        type="text"
                                        value={newUser.assignedArea}
                                        onChange={e => setNewUser({ ...newUser, assignedArea: e.target.value })}
                                        className="input-field-light"
                                        placeholder="e.g. Building A"
                                    />
                                </div>
                            )}

                            <div className="mt-4">
                                <label className="block text-sm font-medium mb-1 text-gray-700">Password</label>
                                <input
                                    type="password"
                                    value={(newUser as any).password || ''}
                                    onChange={e => setNewUser({ ...newUser, password: e.target.value } as any)}
                                    className="input-field-light"
                                    placeholder="Leave empty for auto-generated"
                                />
                            </div>


                            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700 border border-blue-100 mt-4">
                                <p>If password is left empty, a random one will be generated and sent to email.</p>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Create & Send Email
                                </button>
                            </div>
                        </form>
                    </div>
                </div >
            )}

            {/* Edit Modal */}
            {
                editingUser && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
                            <h3 className="text-lg font-bold mb-4 text-gray-900">Edit {role.charAt(0).toUpperCase() + role.slice(1)}</h3>
                            <form onSubmit={handleUpdateUser} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Name</label>
                                    <input
                                        type="text"
                                        value={editingUser.name}
                                        onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                                        className="input-field-light"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-700">Phone</label>
                                        <input
                                            type="text"
                                            value={editingUser.phone || ''}
                                            onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })}
                                            className="input-field-light"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-700">Department</label>
                                        <input
                                            type="text"
                                            value={editingUser.department || ''}
                                            onChange={e => setEditingUser({ ...editingUser, department: e.target.value })}
                                            className="input-field-light"
                                            disabled={role === 'technician'}
                                        />
                                    </div>
                                </div>

                                {role !== 'warden' && (
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium mb-1 text-gray-700">Access Scope</label>
                                        <select
                                            value={editingUser.accessScope || 'college'}
                                            onChange={e => setEditingUser({ ...editingUser, accessScope: e.target.value as any })}
                                            className="input-field-light"
                                        >
                                            <option value="college">College Only</option>
                                            <option value="hostel">Hostel Only</option>
                                            <option value="both">Both (College & Hostel)</option>
                                        </select>
                                    </div>
                                )}

                                {role === 'technician' && editingUser.technician && (
                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-gray-700">Skill Type</label>
                                            <select
                                                value={editingUser.technician.skillType}
                                                onChange={e => setEditingUser({
                                                    ...editingUser,
                                                    technician: { ...editingUser.technician!, skillType: e.target.value }
                                                })}
                                                className="input-field-light"
                                            >
                                                <option value="Electrician">Electrician</option>
                                                <option value="Plumber">Plumber</option>
                                                <option value="Maintenance Technician">Maintenance Technician</option>
                                                <option value="IT Technician">IT Technician</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-gray-700">Assigned Area</label>
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

                                {role === 'cleaner' && editingUser.cleaner && (
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium mb-1 text-gray-700">Assigned Area</label>
                                        <input
                                            type="text"
                                            value={editingUser.cleaner.assignedArea}
                                            onChange={e => setEditingUser({
                                                ...editingUser,
                                                cleaner: { ...editingUser.cleaner!, assignedArea: e.target.value }
                                            })}
                                            className="input-field-light"
                                        />
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setEditingUser(null)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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
                )
            }
        </div >
    );
};

export default UserManagement;
