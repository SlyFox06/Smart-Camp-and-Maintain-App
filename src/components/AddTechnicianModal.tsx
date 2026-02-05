import { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { addTechnician } from '../data/mockData';
import type { Technician } from '../types';

const AddTechnicianModal = ({ onClose }: { onClose: () => void }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        building: '',
        specialization: 'general',
        phone: '',
        password: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newTech: Technician = {
            id: `T${Date.now()}`,
            name: formData.name,
            email: formData.email,
            role: 'technician',
            phone: formData.phone || '+91 99999 00000',
            specialization: [formData.specialization],
            assignedBuilding: formData.building,
            availability: 'available',
            assignedComplaints: 0,
            completedComplaints: 0,
            averageResolutionTime: 0,
            rating: 5.0,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`,
            password: formData.password || 'password123'
        } as any;

        addTechnician(newTech);
        alert(`✅ Technician ${newTech.name} Registered Successfully!`);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Register Technician</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="input-field-light"
                            placeholder="e.g. John Doe"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="input-field-light"
                            placeholder="john@campus.edu"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Primary Skill</label>
                        <select
                            value={formData.specialization}
                            onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                            className="input-field-light"
                        >
                            <option value="general">General Maintenance</option>
                            <option value="electrical">Electrical</option>
                            <option value="plumbing">Plumbing</option>
                            <option value="it">IT / Computer</option>
                            <option value="ac">AC / HVAC</option>
                            <option value="cleaning">Cleaning</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                        <input
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="input-field-light"
                            placeholder="+91 98765 43210"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="input-field-light"
                            placeholder="Set a password"
                        />
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 btn-primary flex items-center justify-center gap-2"
                        >
                            <UserPlus className="w-4 h-4" />
                            Register
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTechnicianModal;
