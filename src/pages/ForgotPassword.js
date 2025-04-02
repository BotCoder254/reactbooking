import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEnvelope } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/layouts/AuthLayout';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      await resetPassword(email);
      setMessage('Check your inbox for password reset instructions');
    } catch (err) {
      setError('Failed to reset password. Please check your email address.');
    }

    setLoading(false);
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="We'll send you instructions to reset your password"
      imageSrc="https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80"
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

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-100 text-green-600 p-3 rounded-lg text-sm"
          >
            {message}
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

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#8F87F1] text-white py-3 rounded-lg hover:bg-[#C68EFD] transition duration-300 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Reset Password'}
        </button>

        <div className="text-center space-y-2">
          <Link to="/login" className="text-[#8F87F1] hover:text-[#C68EFD] block">
            Back to Sign In
          </Link>
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#8F87F1] hover:text-[#C68EFD]">
              Sign up
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword; 