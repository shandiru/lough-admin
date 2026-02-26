import React, { useState } from "react";
import { Link } from "react-router-dom";
// Service function-ai import seiyavum
import { requestPasswordReset } from "../api/services";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(null);

  const startCountdown = () => {
    let seconds = 300;
    setCountdown(seconds);
    const interval = setInterval(() => {
      seconds -= 1;
      setCountdown(seconds);
      if (seconds <= 0) {
        clearInterval(interval);
        setCountdown(0);
      }
    }, 1000);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      // API call using the service
      const res = await requestPasswordReset(email);
      
      setStatus("success");
      setMessage(res.message || "Reset link sent! Check your email.");
      startCountdown();
    } catch (err) {
      setStatus("error");
      // Service-il irundhu vara error string-ai set panrom
      setMessage(err);
    }
  };

  const canResend = countdown === 0;

  return (
    <div className="min-h-screen bg-brand-soft flex items-center justify-center px-4">
      <div className="bg-brand-light rounded-2xl shadow-xl w-full max-w-md p-8">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <img
            src="/logo.webp"
            alt="Lough Skin"
            className="h-16 mb-4"
          />
          <h1 className="text-2xl font-semibold text-brand">
            Forgot Password
          </h1>
          <p className="text-sm text-brand/80 text-center mt-1">
            Enter your email to receive a reset link
          </p>
        </div>

        {/* Countdown */}
        {countdown !== null && countdown > 0 && (
          <div className="mb-4 bg-brand/10 text-brand p-3 rounded-lg text-sm text-center">
            Reset link expires in{" "}
            <span className="font-semibold">
              {formatTime(countdown)}
            </span>
          </div>
        )}

        {countdown === 0 && (
          <div className="mb-4 bg-red-100 text-red-600 p-3 rounded-lg text-sm text-center">
            Link expired — you can request a new one
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-brand mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              autoComplete="email"
              disabled={
                status === "loading" ||
                (countdown !== null && countdown > 0)
              }
              className="w-full px-4 py-2 rounded-xl border border-brand/30 focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          {message && (
            <div
              className={`text-sm p-3 rounded-lg ${
                status === "success"
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={
              status === "loading" ||
              (countdown !== null && countdown > 0)
            }
            className="w-full py-2 rounded-xl bg-brand text-white font-medium transition hover:opacity-90 disabled:opacity-50"
          >
            {status === "loading"
              ? "Sending..."
              : countdown !== null && countdown > 0
              ? `Wait ${formatTime(countdown)}`
              : canResend
              ? "Resend Reset Link"
              : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-6 text-sm text-center text-brand">
          Remember your password?{" "}
          <Link to="/login" className="underline font-medium">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;