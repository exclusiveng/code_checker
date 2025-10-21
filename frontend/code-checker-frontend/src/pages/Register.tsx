import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api/api';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/register', { name, email, password, companyName });
      const { token, user } = res.data;
      if (token) {
        await login(token);
        navigate('/dashboard');
      } else {
        setError('Registration succeeded but no token returned');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-semibold text-center text-blue-700 mb-6">Create your admin account</h1>
        {error && <div className="mb-4 text-red-600 text-center">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full p-2 border rounded" />
          </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Company name</label>
                    <input required value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1 w-full p-2 border rounded" />
                  </div>

          <button disabled={loading} className={`w-full py-2 rounded bg-blue-600 text-white ${loading ? 'opacity-60' : ''}`}>
            {loading ? 'Creating...' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}
