import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginSuccess, setError, clearError } from "../store/slices/authSlice";
import { loginUser } from "../api/auth";

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (message) setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    dispatch(clearError());

    try {
      
      const data = await loginUser(form);
      
      const { accessToken, user } = data;

   
      dispatch(loginSuccess({ accessToken, user }));

   
      if (user.role === "admin") {
        navigate("/dashboard/admin");
      } else {
        navigate("/dashboard/staff");
      }
    } catch (err) {
     
      setStatus("error");
      setMessage(err);
      dispatch(setError(err));
    }
  };

  return (
    <div className="min-h-screen bg-brand-soft flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl p-8">
        
        <div className="text-center mb-8">
          <img src="/logo.webp" alt="Lough Skin" className="mx-auto h-20 object-contain" />
          <h1 className="mt-4 text-2xl font-semibold text-brand">Welcome Back</h1>
          <p className="text-gray-600 text-sm">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
       
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="john@example.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand transition"
            />
          </div>

        
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <Link to="/forgot-password" title="forgot link" className="text-sm text-brand hover:underline">Forgot?</Link>
            </div>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand transition"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand text-sm">
                {showPass ? "Hide" : "Show"}
              </button>
            </div>
          </div>

         
          {message && (
            <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {message}
            </div>
          )}

         
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-brand text-white py-2.5 rounded-lg font-medium shadow-md hover:opacity-90 transition disabled:opacity-50"
          >
            {status === "loading" ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-gray-700">
          Need an account? <Link to="/register" className="text-brand font-medium hover:underline">Request Invite</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;