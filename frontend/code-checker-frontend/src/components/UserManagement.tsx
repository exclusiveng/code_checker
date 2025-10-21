import React, { useState } from 'react';
import { Loader2, UserPlus } from 'lucide-react';
import api from '../api/api';

export const UserManagement: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('developer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('developer');
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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register user. Please try again.');
      console.error('User registration failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Register New User</h2>
      <p className="text-gray-500 text-sm mb-6">
        Add a new user to your company. They will receive an email to verify their account.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              placeholder="John Doe"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            >
              <option value="developer">Developer</option>
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
            className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            placeholder="user@company.com"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm"
            placeholder="••••••••"
            required
          />
        </div>

        {error && <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">{error}</div>}
        {successMessage && <div className="text-green-600 bg-green-50 border border-green-200 rounded-lg p-3 text-sm">{successMessage}</div>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-all disabled:bg-blue-300"
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
          {isSubmitting ? 'Registering User...' : 'Register User'}
        </button>
      </form>
    </div>
  );
};