import React, { useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

const url = 'http://localhost:4000'

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [resetLink, setResetLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setResetLink('');

    try {
      const { data } = await axios.post(`${url}/api/user/forgot-password`, { email });
      if (data.success) {
        setMessage(data.message || 'Reset link generated.');
        if (data.resetLink) {
          try {
            const parsed = new URL(data.resetLink);
            const token = parsed.pathname.split('/').pop();
            setResetLink(`${window.location.origin}/reset-password/${token}`);
          } catch {
            setResetLink(data.resetLink);
          }
        }
      } else {
        setError(data.message || 'Failed to generate reset link');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-[#1a120b] p-4'>
      <div className='w-full max-w-md bg-gradient-to-br from-[#2D1B0E] to-[#4A372A] p-8 rounded-xl shadow-lg border-4 border-amber-700/30'>
        <h1 className='text-2xl font-bold text-center bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent mb-6'>
          Forgot Password
        </h1>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <input
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder='Enter your registered email'
            className='w-full px-4 py-3 rounded-lg bg-[#2D1B0E] text-amber-100 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-600'
            required
          />

          <button
            type='submit'
            disabled={loading}
            className='w-full bg-gradient-to-r from-amber-400 to-amber-600 text-[#2d1b0e] font-bold py-3 rounded-lg'
          >
            {loading ? 'Generating...' : 'Generate Reset Link'}
          </button>
        </form>

        {message && <p className='text-green-400 mt-4 text-sm'>{message}</p>}
        {error && <p className='text-red-400 mt-4 text-sm'>{error}</p>}

        {resetLink && (
          <a href={resetLink} className='block mt-4 text-amber-300 underline break-all'>
            {resetLink}
          </a>
        )}

        <div className='mt-6 text-center'>
          <Link to='/login' className='text-amber-400 hover:text-amber-600 transition-colors'>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword

