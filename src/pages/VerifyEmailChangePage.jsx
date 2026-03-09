import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

const VerifyEmailChangePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      setStatus('error');
      setMessage('Invalid verification link. Please contact your administrator.');
      return;
    }

    axiosInstance
      .post('/staff/verify-email-change', { token, email })
      .then((res) => {
        setStatus('success');
        setMessage(res.data.message || 'Email verified successfully!');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(
          err.response?.data?.message ||
            'Verification link is invalid or has expired. Please contact your administrator.'
        );
      });
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5EDE4] px-4">
      <div className="bg-white rounded-[32px] shadow-2xl p-10 max-w-md w-full text-center">
        {/* Logo / Brand */}
        <h1 className="text-3xl font-serif italic text-gray-900 mb-1">
          Lough <span className="text-[#22B8C8]">Skin</span>
        </h1>
        <div className="h-1 w-14 bg-[#22B8C8] rounded-full mx-auto mb-8" />

        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#22B8C8]/30 border-t-[#22B8C8] rounded-full animate-spin" />
            <p className="text-gray-500 font-medium">Verifying your new email address…</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-5">
            {/* Success icon */}
            <div className="w-16 h-16 bg-[#22B8C8]/10 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-[#22B8C8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 mb-2">Email Verified!</h2>
              <p className="text-gray-500 text-sm leading-relaxed">{message}</p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-4 bg-[#22B8C8] hover:bg-[#24a1ad] text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-[#22B8C8]/20"
            >
              Go to Login →
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-5">
            {/* Error icon */}
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 mb-2">Verification Failed</h2>
              <p className="text-gray-500 text-sm leading-relaxed">{message}</p>
            </div>
            <p className="text-xs text-gray-400">
              Please ask your administrator to resend the email change or contact support.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailChangePage;
