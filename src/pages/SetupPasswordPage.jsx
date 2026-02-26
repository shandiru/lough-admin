import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { verifySetupPassword } from "../api/services"; 

const SetupPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });

  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      setStatus("error");
      setMessage("Invalid or missing invite link. Please request a new invite.");
    }
  }, [token, email]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match!");
      return;
    }

    if (form.password.length < 6) {
      setStatus("error");
      setMessage("Password must be at least 6 characters.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
     
      const data = await verifySetupPassword({
        token,
        email,
        password: form.password,
      });

      setStatus("success");
      setMessage(data.message || "Account setup successful!");
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

  const strength = passwordStrength(form.password);
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["", "bg-red-400", "bg-yellow-400", "bg-blue-400", "bg-green-500"];

  return (
    <div className="min-h-screen bg-brand-soft flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl p-8">

       
        <div className="text-center mb-8">
          <img src="/logo.webp" alt="Lough Skin" className="mx-auto h-20 object-contain" />
          <h1 className="mt-4 text-2xl font-semibold text-brand">Setup Password</h1>
          <p className="text-gray-600 text-sm">Create your account password</p>
        </div>

       
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input type="email" value={email || ""} disabled className="w-full rounded-lg px-4 py-2 bg-gray-100 text-gray-500 cursor-not-allowed" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
         
          <div>
            <label className="block text-sm font-medium mb-1">New Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="Enter new password"
                disabled={status === "success" || !token || !email}
                className="w-full rounded-lg px-4 py-2 bg-brand-light/30 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-brand outline-none transition"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand text-sm">
                {showPass ? "Hide" : "Show"}
              </button>
            </div>

          
            {form.password && (
              <div className="mt-3">
                <div className="flex gap-2 mb-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`h-2 flex-1 rounded ${i <= strength ? strengthColors[strength] : "bg-gray-200"}`} />
                  ))}
                </div>
                <p className={`text-sm ${strength === 1 ? "text-red-500" : strength === 2 ? "text-yellow-500" : strength === 3 ? "text-blue-500" : strength === 4 ? "text-green-600" : ""}`}>
                  {strengthLabels[strength]}
                </p>
              </div>
            )}
          </div>

          
          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                required
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                disabled={status === "success" || !token || !email}
                className="w-full rounded-lg px-4 py-2 bg-brand-light/30 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-brand outline-none transition"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand text-sm">
                {showConfirm ? "Hide" : "Show"}
              </button>
            </div>
            {form.confirmPassword && form.password !== form.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">Passwords don't match</p>
            )}
          </div>

         
          {message && (
            <div className={`text-sm rounded-lg px-4 py-2 ${status === "success" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
              {message}
            </div>
          )}

          
          <button
            type="submit"
            disabled={status === "loading" || status === "success" || !token || !email}
            className="w-full bg-brand text-white py-2.5 rounded-lg font-medium shadow-md hover:opacity-90 transition disabled:opacity-50"
          >
            {status === "loading" ? "Setting up..." : status === "success" ? "Done! Redirecting..." : "Complete Setup"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetupPasswordPage;