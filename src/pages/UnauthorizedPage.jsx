import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const role = useSelector((state) => state.auth?.user?.role);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const handleBack = () => {
    if (role === 'admin') navigate('/dashboard/admin');
    else if (role === 'staff') navigate('/dashboard/staff');
    else navigate('/login');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#F5EDE4' }}
    >
     
      <div
        style={{
          position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: '-80px', right: '-80px',
          width: '420px', height: '420px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,184,200,0.10) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-60px', left: '-60px',
          width: '320px', height: '320px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,184,200,0.07) 0%, transparent 70%)',
        }} />
      </div>

      <div
        style={{
          position: 'relative', zIndex: 1,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
          width: '100%', maxWidth: '440px',
        }}
      >
        <div style={{
          background: 'white',
          borderRadius: '40px',
          padding: '48px 40px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.08)',
          border: '1px solid rgba(34,184,200,0.10)',
          textAlign: 'center',
        }}>

          {/* Brand */}
          <p style={{
            fontSize: '11px', fontWeight: 900, letterSpacing: '4px',
            color: '#22B8C8', textTransform: 'uppercase', marginBottom: '24px',
          }}>
            Lough Skin
          </p>

          {/* Lock icon in brand circle */}
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'rgba(34,184,200,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 28px',
            border: '2px solid rgba(34,184,200,0.15)',
          }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
              stroke="#22B8C8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          {/* 401 */}
          <p style={{
            fontSize: '11px', fontWeight: 900, letterSpacing: '4px',
            color: '#d1c4b8', textTransform: 'uppercase', marginBottom: '8px',
          }}>
            Error 401
          </p>

          {/* Heading — serif italic like the modals */}
          <h1 style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontStyle: 'italic',
            fontSize: '32px',
            fontWeight: 700,
            color: '#1a1a1a',
            lineHeight: 1.2,
            marginBottom: '12px',
          }}>
            Access <span style={{ color: '#22B8C8' }}>Denied</span>
          </h1>

          {/* Teal divider bar — exact same as modals */}
          <div style={{
            height: '4px', width: '56px', background: '#22B8C8',
            borderRadius: '9999px', margin: '0 auto 20px',
          }} />

          <p style={{
            fontSize: '14px', color: '#888', lineHeight: 1.7,
            marginBottom: '32px', fontWeight: 500,
          }}>
            You don't have permission to view this page.
            <br />
            Please contact your administrator if you think this is a mistake.
          </p>

          {/* CTA button — exact brand button style */}
          <button
            onClick={handleBack}
            style={{
              width: '100%',
              padding: '18px',
              background: '#22B8C8',
              color: 'white',
              border: 'none',
              borderRadius: '16px',
              fontSize: '11px',
              fontWeight: 900,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 12px 32px rgba(34,184,200,0.25)',
              transition: 'background 0.2s, transform 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#1fa3b2';
              e.currentTarget.style.transform = 'scale(1.01)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#22B8C8';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Go to My Dashboard →
          </button>

          {/* Secondary link */}
          <button
            onClick={() => navigate('/login')}
            style={{
              marginTop: '16px',
              background: 'none',
              border: 'none',
              fontSize: '10px',
              fontWeight: 900,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#c4b5a8',
              cursor: 'pointer',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#B62025'}
            onMouseLeave={e => e.currentTarget.style.color = '#c4b5a8'}
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;