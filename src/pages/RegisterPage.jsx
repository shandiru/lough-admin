import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { sendInvite } from "../api/services"; 

const RegisterPage = () => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "",
    role: "admin",
    adminKey: "",
  });

  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(null);
  

  const timerRef = useRef(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const startCountdown = () => {
    let seconds = 300;
    setCountdown(seconds);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setStatus("loading");
    setMessage("");

    try {
      
      const data = await sendInvite(form);
      
      setStatus("success");
      setMessage(data.message);
      startCountdown();
    } catch (err) {
      setStatus("error");
      setMessage(err);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const canResend = countdown === 0;

  return (
    <div className="min-h-screen bg-brand-soft flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl p-8">
        
        <div className="text-center mb-8">
          <img src="/logo.webp" alt="Lough Skin" className="mx-auto h-20 object-contain" />
          <h1 className="mt-4 text-2xl font-semibold text-brand">Invite User</h1>
          <p className="text-gray-600 text-sm">Send a secure setup link to a new user</p>
        </div>

        {countdown !== null && countdown > 0 && (
          <div className="mb-6 bg-brand/10 text-brand rounded-lg px-4 py-2 text-sm text-center">
             Invite link expires in <strong>{formatTime(countdown)}</strong>
          </div>
        )}

        {countdown === 0 && (
          <div className="mb-6 bg-red-50 text-red-600 rounded-lg px-4 py-2 text-sm text-center">
             Link expired — you can send a new invite
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">First Name</label>
              <input type="text" name="firstName" required value={form.firstName} onChange={handleChange} placeholder="John" className="w-full rounded-lg px-4 py-2 bg-brand-light/30 focus:bg-white focus:ring-2 focus:ring-brand outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Name</label>
              <input type="text" name="lastName" required value={form.lastName} onChange={handleChange} placeholder="Doe" className="w-full rounded-lg px-4 py-2 bg-brand-light/30 focus:bg-white focus:ring-2 focus:ring-brand outline-none transition" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" name="email" required value={form.email} onChange={handleChange} placeholder="john@example.com" className="w-full rounded-lg px-4 py-2 bg-brand-light/30 focus:bg-white focus:ring-2 focus:ring-brand outline-none transition" />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+94 712345678" className="w-full rounded-lg px-4 py-2 bg-brand-light/30 focus:bg-white focus:ring-2 focus:ring-brand outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange} className="w-full rounded-lg px-4 py-2 bg-brand-light/30 focus:bg-white focus:ring-2 focus:ring-brand outline-none transition">
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Admin Secret Key</label>
            <input type="password" name="adminKey" required value={form.adminKey} onChange={handleChange} placeholder="Enter admin secret key" className="w-full rounded-lg px-4 py-2 bg-brand-light/30 focus:bg-white focus:ring-2 focus:ring-brand outline-none transition" />
          </div>

          {message && (
            <div className={`text-sm rounded-lg px-4 py-2 ${status === "success" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={status === "loading" || (countdown !== null && countdown > 0)}
            className="w-full bg-brand text-white py-2.5 rounded-lg font-medium shadow-md hover:opacity-90 transition disabled:opacity-50"
          >
            {status === "loading" ? "Sending..." : countdown > 0 ? `Wait ${formatTime(countdown)}` : canResend ? "Resend Invite" : "Send Invite Link"}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-gray-700">
          Already have an account? <Link to="/login" className="text-brand font-medium hover:underline">Login</Link>
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;