import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { resetPasswordConfirm, checkTokenStatus } from "../api/auth";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  
  useEffect(() => {
    const verifyTokenOnLoad = async () => {
      if (!token || !email) {
        setStatus("error");
        setMessage("Invalid or missing reset link. Please request a new one.");
        return;
      }

      try {
        setStatus("loading");
       
        await checkTokenStatus(token, email);
        setStatus("idle");
      } catch (err) {
        setStatus("error");
        
        setMessage(err); 
      }
    };

    verifyTokenOnLoad();
  }, [token, email]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match!");
      return;
    }

    if (form.newPassword.length < 6) {
      setStatus("error");
      setMessage("Password must be at least 6 characters.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const res = await resetPasswordConfirm({
        token,
        email,
        newPassword: form.newPassword,
      });

      setStatus("success");
      setMessage(res.message || "Password reset successfully!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setStatus("error");
      setMessage(err);
    }
  };

  const passwordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = passwordStrength(form.newPassword);
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

  return (
    <div className="min-h-screen bg-brand-soft flex items-center justify-center px-4">
      <div className="bg-brand-light rounded-2xl shadow-xl w-full max-w-md p-8">
       
        <div className="flex flex-col items-center mb-6">
          <img src="/logo.webp" alt="Lough Skin" className="h-16 mb-4" />
          <h1 className="text-2xl font-semibold text-brand">Reset Password</h1>
          <p className="text-sm text-brand/80 text-center mt-1">
            Enter your new password
          </p>
        </div>

        
        <div className="mb-6">
          <label className="block text-sm text-brand mb-1">Email</label>
          <input
            type="email"
            value={email || ""}
            disabled
            className="w-full px-4 py-2 rounded-xl border border-brand/30 bg-brand-soft/40 text-brand"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div>
            <label className="block text-sm text-brand mb-1">New Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                name="newPassword"
                required
                value={form.newPassword}
                onChange={handleChange}
                
                disabled={status === "success" || status === "error" || !token || !email}
                className="w-full px-4 py-2 rounded-xl border border-brand/30 focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-2 text-brand text-sm"
              >
                {showPass ? "Hide" : "Show"}
              </button>
            </div>

            {form.newPassword && (
              <div className="mt-3">
                <div className="flex gap-2 mb-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-2 flex-1 rounded-full ${
                        i <= strength ? "bg-brand" : "bg-brand-soft"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-brand">{strengthLabels[strength]}</p>
              </div>
            )}
          </div>

          
          <div>
            <label className="block text-sm text-brand mb-1">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                required
                value={form.confirmPassword}
                onChange={handleChange}
                disabled={status === "success" || status === "error" || !token || !email}
                className="w-full px-4 py-2 rounded-xl border border-brand/30 focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
                placeholder="Confirm password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-2 text-brand text-sm"
              >
                {showConfirm ? "Hide" : "Show"}
              </button>
            </div>
            {form.confirmPassword && form.newPassword !== form.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>

          
          {message && (
            <div
              className={`text-sm p-3 rounded-lg ${
                status === "success" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
              }`}
            >
              {message}
            </div>
          )}

         
          <button
            type="submit"
            disabled={status === "loading" || status === "success" || status === "error" || !token || !email}
            className="w-full py-2 rounded-xl bg-brand text-white font-medium transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "loading"
              ? "Verifying..."
              : status === "success"
              ? "Done! Redirecting..."
              : "Reset Password"}
          </button>
        </form>

        <div className="mt-6 text-sm text-center text-brand">
          <Link to="/forgot-password" className="underline font-medium">
            Request a new reset link
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;