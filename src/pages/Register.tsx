import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); // we’ll optionally auto-login after register

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Admin' | 'BaseCommander' | 'LogisticsOfficer'>('BaseCommander');
  const [baseId, setBaseId] = useState<string>('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await axios.post(
        'https://millitary-asset-backend.onrender.com/auth/register',
        {
          username,
          password,
          role,
          baseId: role === 'Admin' ? null : baseId,
        }
      );

      // Option A: Redirect to login (unchanged from before)
      // navigate('/login');

      // Option B: Auto-login after register. (Uncomment if desired)
      // const loginRes = await axios.post(
      //   'https://millitary-asset-backend.onrender.com/auth/login',
      //   { username, password }
      // );
      // const token = loginRes.data.data.token;
      // login(token);
      // navigate('/dashboard');

      // ============
      // For now, just go to /login:
      navigate('/login');
      // ============
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <form
        onSubmit={handleRegister}
        className="bg-white p-6 rounded-lg shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Register</h2>

        {error && <p className="text-red-600 mb-3 text-center">{error}</p>}

        <div className="mb-4">
          <label className="block mb-1 font-medium">Username</label>
          <input
            type="text"
            className="w-full border px-3 py-2 rounded-md"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Password</label>
          <input
            type="password"
            className="w-full border px-3 py-2 rounded-md"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Role</label>
          <select
            className="w-full border px-3 py-2 rounded-md"
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            disabled={isLoading}
          >
            <option value="Admin">Admin</option>
            <option value="BaseCommander">Base Commander</option>
            <option value="LogisticsOfficer">Logistics Officer</option>
          </select>
        </div>

        {role !== 'Admin' && (
          <div className="mb-4">
            <label className="block mb-1 font-medium">Base ID</label>
            <input
              type="text"
              className="w-full border px-3 py-2 rounded-md"
              placeholder="Enter Base UUID"
              value={baseId}
              onChange={(e) => setBaseId(e.target.value)}
              required
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              (Admins do not need a Base ID; for other roles, supply the base’s UUID.)
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2 rounded-md text-white ${
            isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isLoading ? 'Registering…' : 'Register'}
        </button>

        <p className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login here
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
