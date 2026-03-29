import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ username: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    axios.get('http://localhost:4000/api/user/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(({ data }) => {
        if (data.success && data.user) {
          setProfile(data.user);
          setForm({ username: data.user.username || '', email: data.user.email || '' });
        } else {
          setError(data.message || 'Failed to load profile');
        }
      })
      .catch(() => {
        setError('Failed to load profile');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const token = localStorage.getItem('authToken');
    axios.put('http://localhost:4000/api/user/me', {
      username: form.username,
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(({ data }) => {
        if (data.success && data.user) {
          setProfile(data.user);
          setSuccess('Profile updated successfully');
          setIsEditing(false);
          const existingUser = JSON.parse(localStorage.getItem('user') || '{}');
          localStorage.setItem('user', JSON.stringify({
            ...existingUser,
            email: data.user.email,
            username: data.user.username,
          }));
        } else {
          setError(data.message || 'Failed to update profile');
        }
      })
      .catch(() => setError('Failed to update profile'))
      .finally(() => setSaving(false));
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('loginData');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };

  if (loading) {
    return (
      <div className='min-h-[60vh] flex items-center justify-center text-amber-200'>
        Loading profile...
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-[60vh] flex items-center justify-center text-red-400'>
        {error}
      </div>
    );
  }

  return (
    <div className='min-h-[60vh] flex items-center justify-center py-12 px-4 relative'>
      <div className='w-full max-w-xl bg-[#4b3b3b]/80 rounded-3xl p-8 shadow-2xl border border-amber-500/30'>
        <h1 className='text-3xl font-bold mb-6 bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent text-center'>
          My Profile
        </h1>
        {!isEditing ? (
          <div className='space-y-5'>
            <div className='bg-[#3a2b2b]/50 border border-amber-500/20 rounded-xl px-4 py-3'>
              <p className='text-xs text-amber-300/80 mb-1'>Username</p>
              <p className='text-amber-100 font-medium'>{profile?.username || '-'}</p>
            </div>
            <div className='bg-[#3a2b2b]/50 border border-amber-500/20 rounded-xl px-4 py-3'>
              <p className='text-xs text-amber-300/80 mb-1'>Email</p>
              <p className='text-amber-100 font-medium'>{profile?.email || '-'}</p>
            </div>

            {success && <p className='text-green-400 text-sm'>{success}</p>}

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2'>
              <button
                type='button'
                onClick={() => {
                  setForm({ username: profile?.username || '', email: profile?.email || '' });
                  setIsEditing(true);
                  setError('');
                  setSuccess('');
                }}
                className='w-full bg-gradient-to-r from-amber-500 to-amber-600 text-[#2D1B0E] font-bold py-3 rounded-xl hover:scale-[1.02] transition-transform'
              >
                Edit Profile
              </button>
              <button
                type='button'
                onClick={() => setShowLogoutConfirm(true)}
                className='w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-3 rounded-xl hover:scale-[1.02] transition-transform'
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className='space-y-5'>
            <div>
              <label className='block text-sm text-amber-200 mb-1'>Username</label>
              <input
                type='text'
                name='username'
                value={form.username}
                onChange={handleChange}
                className='w-full bg-[#3a2b2b]/70 border border-amber-500/30 rounded-xl px-4 py-3 text-amber-100 focus:outline-none focus:border-amber-400'
                required
              />
            </div>

            <div>
              <label className='block text-sm text-amber-200 mb-1'>Email</label>
              <input
                type='email'
                name='email'
                value={form.email}
                disabled
                className='w-full bg-[#3a2b2b]/40 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-300 cursor-not-allowed'
              />
            </div>

            {error && <p className='text-red-400 text-sm'>{error}</p>}

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2'>
              <button
                type='submit'
                disabled={saving}
                className='w-full bg-gradient-to-r from-amber-500 to-amber-600 text-[#2D1B0E] font-bold py-3 rounded-xl hover:scale-[1.02] transition-transform'
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type='button'
                onClick={() => {
                  setIsEditing(false);
                  setError('');
                }}
                className='w-full bg-[#3a2b2b]/80 border border-amber-500/30 text-amber-100 font-bold py-3 rounded-xl hover:bg-[#3a2b2b]'
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {showLogoutConfirm && (
        <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4'>
          <div className='w-full max-w-md bg-[#2D1B0E] border-2 border-amber-500/30 rounded-2xl p-6 shadow-2xl'>
            <h2 className='text-xl font-bold text-amber-200 mb-2'>Confirm Logout</h2>
            <p className='text-amber-100/80 mb-6'>Are you sure you want to logout?</p>
            <div className='flex gap-3'>
              <button
                type='button'
                onClick={() => setShowLogoutConfirm(false)}
                className='flex-1 py-2.5 rounded-xl border border-amber-500/30 text-amber-100 hover:bg-[#3a2b2b]/60'
              >
                Cancel
              </button>
              <button
                type='button'
                onClick={handleLogout}
                className='flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold'
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile

