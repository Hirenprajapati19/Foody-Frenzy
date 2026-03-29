import React, { useState } from 'react'
import axios from 'axios'
import { Link, useNavigate, useParams } from 'react-router-dom'

const url = 'http://localhost:4000'

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(`${url}/api/user/reset-password/${token}`, { password });
      if (data.success) {
        setSuccess('Password reset successful. Redirecting to login...');
        setTimeout(() => navigate('/login', { replace: true }), 1500);
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-[#1a120b] p-4'>
      <div className='w-full max-w-md bg-gradient-to-br from-[#2D1B0E] to-[#4A372A] p-8 rounded-xl shadow-lg border-4 border-amber-700/30'>
        <h1 className='text-2xl font-bold text-center bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent mb-6'>
          Reset Password
        </h1>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <input
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder='New Password'
            className='w-full px-4 py-3 rounded-lg bg-[#2D1B0E] text-amber-100 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-600'
            required
          />
          <input
            type='password'
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder='Confirm New Password'
            className='w-full px-4 py-3 rounded-lg bg-[#2D1B0E] text-amber-100 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-600'
            required
          />

          <button
            type='submit'
            disabled={loading}
            className='w-full bg-gradient-to-r from-amber-400 to-amber-600 text-[#2d1b0e] font-bold py-3 rounded-lg'
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        {success && <p className='text-green-400 mt-4 text-sm'>{success}</p>}
        {error && <p className='text-red-400 mt-4 text-sm'>{error}</p>}

        <div className='mt-6 text-center'>
          <Link to='/login' className='text-amber-400 hover:text-amber-600 transition-colors'>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword

