import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaGoogle, FaEnvelope, FaLock } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/layouts/AuthLayout';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, googleSignIn } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await login(email, password);
      const userRole = userCredential.user.role || 'user';
      navigate(userRole === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError('Failed to sign in');
    }

    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    try {
      const userCredential = await googleSignIn();
      const userRole = userCredential.user.role || 'user';
      navigate(userRole === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError('Failed to sign in with Google');
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to continue your journey"
      imageSrc="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 text-red-600 p-3 rounded-lg text-sm"
          >
            {error}
          </motion.div>
        )}

        <div>
          <div className="relative">
            <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#8F87F1]"
              placeholder="Email address"
              required
            />
          </div>
        </div>

        <div>
          <div className="relative">
            <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#8F87F1]"
              placeholder="Password"
              required
            />
          </div>
          <Link
            to="/forgot-password"
            className="block text-sm text-[#8F87F1] hover:text-[#C68EFD] mt-2"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#8F87F1] text-white py-3 rounded-lg hover:bg-[#C68EFD] transition duration-300 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition duration-300"
        >
          <FaGoogle className="text-red-500" />
          Sign in with Google
        </button>

        <p className="text-center text-gray-600 mt-8">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#8F87F1] hover:text-[#C68EFD]">
            Create account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Login; 