import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export default function Auth() {
  const navigate = useNavigate();
  const { login, register, error } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    rememberMe: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLocalError('');

    let authResult = { success: false, user: null };

    if (isSignUp) {
      if (!formData.name.trim()) {
        setLocalError('Please enter your name');
        setLoading(false);
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setLocalError('Passwords do not match');
        setLoading(false);
        return;
      }
      authResult = await register(
        formData.name,
        formData.email,
        formData.password,
        formData.confirmPassword
      );
    } else {
      authResult = await login(formData.email, formData.password);
    }

    setLoading(false);

    if (authResult.success) {
      navigate(authResult.user?.role === 'owner' ? '/dashboard' : '/chat');
    } else {
      setLocalError(error || 'Authentication failed');
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      rememberMe: false,
    });
    setLocalError('');
  };

  const passwordStrength = (pwd) => {
    if (pwd.length < 8) return { text: 'Weak', color: '#EF4444' };
    if (!/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd)) return { text: 'Fair', color: '#F97316' };
    if (/[!@#$%^&*]/.test(pwd)) return { text: 'Strong', color: '#10B981' };
    return { text: 'Good', color: '#F59E0B' };
  };

  const strength = passwordStrength(formData.password);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0A0A0B' }}>
      {/* LEFT SIDE — Atmospheric Background */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{
          flex: 1,
          background: 'linear-gradient(135deg, #1a1a1f 0%, #0f0f12 50%, #1f1519 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background pattern */}
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(201,168,76,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          top: -100,
          right: -100,
        }} />
        <div style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 70%)',
          borderRadius: '50%',
          bottom: -50,
          left: -50,
        }} />

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          style={{
            textAlign: 'center',
            zIndex: 1,
          }}
        >
          <div style={{
            fontSize: '64px',
            marginBottom: '24px',
            animation: 'float 6s ease-in-out infinite',
          }}>
            🍽️
          </div>

          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '48px',
            fontWeight: 300,
            color: '#C9A84C',
            marginBottom: '12px',
            letterSpacing: '2px',
          }}>
            DINE.AI
          </h1>

          <p style={{
            color: '#9A9490',
            fontSize: '18px',
            fontWeight: 300,
            letterSpacing: '1px',
            marginBottom: '40px',
            maxWidth: '400px',
            lineHeight: 1.6,
          }}>
            The world's most intelligent dining concierge
          </p>

          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            color: '#9A9490',
            fontSize: '14px',
          }}>
            <span>🥂 Luxury Dining</span>
            <span>•</span>
            <span>🤖 AI-Powered</span>
            <span>•</span>
            <span>⚡ Instant Bookings</span>
          </div>
        </motion.div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
        `}</style>
      </motion.div>

      {/* RIGHT SIDE — Auth Form */}
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          background: '#0A0A0B',
        }}
      >
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{
            background: 'rgba(24, 24, 28, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(201, 168, 76, 0.2)',
            borderRadius: '16px',
            padding: '48px 32px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}>
            {/* Header */}
            <div style={{ marginBottom: '32px', textAlign: 'center' }}>
              <h2 style={{
                fontSize: '28px',
                fontWeight: 600,
                color: '#F5F0E8',
                marginBottom: '8px',
              }}>
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p style={{
                color: '#9A9490',
                fontSize: '14px',
              }}>
                {isSignUp
                  ? 'Join DINE.AI and start booking luxury tables'
                  : 'Sign in to your account to continue'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
              {/* Name field (Sign Up only) */}
              {isSignUp && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '11px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#9A9490',
                    marginBottom: '8px',
                  }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Arjun Kumar"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#0A0A0B',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#F5F0E8',
                      fontSize: '15px',
                      boxSizing: 'border-box',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#C9A84C'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                  />
                </div>
              )}

              {/* Email field */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#9A9490',
                  marginBottom: '8px',
                }}>
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#0A0A0B',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#F5F0E8',
                    fontSize: '15px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#C9A84C'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                />
              </div>

              {/* Password field */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#9A9490',
                  marginBottom: '8px',
                }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min. 8 characters"
                    style={{
                      width: '100%',
                      padding: '12px 16px 12px 16px',
                      background: '#0A0A0B',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#F5F0E8',
                      fontSize: '15px',
                      boxSizing: 'border-box',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#C9A84C'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#9A9490',
                      cursor: 'pointer',
                      fontSize: '18px',
                    }}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>

                {/* Password strength indicator (Sign Up only) */}
                {isSignUp && formData.password && (
                  <div style={{
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                  }}>
                    <div style={{
                      flex: 1,
                      height: '4px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      borderRadius: '2px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${(formData.password.length / 16) * 100}%`,
                        height: '100%',
                        background: strength.color,
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                    <span style={{ color: strength.color }}>{strength.text}</span>
                  </div>
                )}
              </div>

              {/* Confirm Password (Sign Up only) */}
              {isSignUp && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '11px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#9A9490',
                    marginBottom: '8px',
                  }}>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#0A0A0B',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#F5F0E8',
                      fontSize: '15px',
                      boxSizing: 'border-box',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#C9A84C'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                  />
                </div>
              )}

              {/* Remember Me / Forgot Password */}
              {!isSignUp && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px',
                }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#9A9490',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}>
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                      style={{ cursor: 'pointer' }}
                    />
                    Remember me
                  </label>
                  <a href="#" style={{
                    color: '#C9A84C',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}>
                    Forgot password?
                  </a>
                </div>
              )}

              {/* Error message */}
              {(localError || error) && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  color: '#EF4444',
                  fontSize: '14px',
                }}>
                  {localError || error}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: loading
                    ? 'rgba(201, 168, 76, 0.3)'
                    : 'linear-gradient(135deg, #C9A84C, #E8C97A)',
                  border: 'none',
                  borderRadius: '8px',
                  color: loading ? '#4A4845' : '#0A0A0B',
                  fontSize: '14px',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: loading ? 0.5 : 1,
                }}
              >
                {loading ? '⏳ Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
              </button>
            </form>

            {/* Toggle */}
            <div style={{
              textAlign: 'center',
              color: '#9A9490',
              fontSize: '14px',
            }}>
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
              <button
                onClick={toggleMode}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#C9A84C',
                  cursor: 'pointer',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </div>

            {/* Divider */}
            <div style={{
              margin: '24px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.06)' }} />
              <span style={{ color: '#4A4845', fontSize: '12px' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.06)' }} />
            </div>

            {/* Google OAuth Button */}
            <button
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#F5F0E8',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(201, 168, 76, 0.1)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
            >
              🔐 Continue with Google
            </button>

            {/* Security badges */}
            <div style={{
              marginTop: '24px',
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              color: '#4A4845',
              fontSize: '11px',
              textAlign: 'center',
            }}>
              <div>🔒 Secure</div>
              <div>•</div>
              <div>🛡️ Encrypted</div>
              <div>•</div>
              <div>⚡ Instant</div>
            </div>
          </div>

          {/* Footer */}
          <p style={{
            marginTop: '24px',
            textAlign: 'center',
            color: '#4A4845',
            fontSize: '12px',
          }}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </motion.div>
    </div>
  );
}
