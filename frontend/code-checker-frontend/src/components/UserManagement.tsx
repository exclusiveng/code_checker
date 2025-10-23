import React, { useState, useEffect } from 'react';
import { Loader2, UserPlus, Users, Shield, Briefcase, Edit, Trash2 } from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../hooks/useAuth';

interface CompanyUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'developer' | 'reviewer';
}

export const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'super_admin' | 'admin' | 'developer' | 'reviewer'>('developer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (!user?.companyId) return; // ✅ Only one check needed
    setLoadingUsers(true);
    try {
      const response = await api.get(`/users`);
      setUsers(response.data.users);
      setFetchError(null);
    } catch (err) {
      setFetchError('Failed to load users.');
      console.error('Failed to fetch users', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user?.companyId]);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('developer');
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/users/${userId}`);
        setUsers(users.filter((u) => u.id !== userId));
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete user.');
        console.error('Failed to delete user', err);
      }
    }
  };

  const handleEditUser = (userId: string) => {
    const userToEdit = users.find((u) => u.id === userId);
    if (userToEdit) {
      console.log('Editing user:', userToEdit);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/users', {
        name,
        email,
        password,
        role,
      });
      setSuccessMessage(`User "${name}" has been registered successfully.`);
      resetForm();
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register user. Please try again.');
      console.error('User registration failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleIcons: Record<CompanyUser['role'], JSX.Element> = {
    super_admin: <Shield className="w-4 h-4 text-red-500" />,
    admin: <Shield className="w-4 h-4 text-blue-500" />,
    developer: <Briefcase className="w-4 h-4 text-gray-500" />,
    reviewer: <Briefcase className="w-4 h-4 text-green-500" />,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* User List Column */}
      <div className="lg:col-span-1">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Users size={22} /> Company Users
        </h2>
        <div className="space-y-3">
          {loadingUsers ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="animate-spin mr-2" /> Loading...
            </div>
          ) : fetchError ? (
            <div className="text-red-500 text-sm">{fetchError}</div>
          ) : (
            users.map((u) => (
              <div
                key={u.id}
                className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="font-medium text-gray-800">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs capitalize font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                    {roleIcons[u.role]}
                    {u.role.replace('_', ' ')}
                  </div>
                  <button
                    onClick={() => handleEditUser(u.id)}
                    className="text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteUser(u.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Registration Form Column */}
      <div className="lg:col-span-2">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Register New User</h2>
          <p className="text-gray-500 text-sm mb-6">
            Add a new user to your company. They will be invited to join via email.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as CompanyUser['role'])}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                >
                  <option value="developer">Developer</option>
                  <option value="reviewer">Reviewer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                placeholder="user@company.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="text-green-600 bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
              {isSubmitting ? 'Registering User...' : 'Register User'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
