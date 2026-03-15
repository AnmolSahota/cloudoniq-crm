// src/ai-property/AuthForm.jsx

import axios from "axios";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BASE_URL } from "./config";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Home,
  Building2,
  BarChart3,
  Bot,
  MapPin,
} from "lucide-react";

// ✅ Public folder images - use string paths
const propertyImage1 = "/assets/images/property-1.jpg";
const propertyImage2 = "/assets/images/property-2.jpg";
const propertyImage3 = "/assets/images/property-3.jpg";

/* ─── Animated background grid dots ─────────────────────────────────────────── */
const GridDots = () => (
  <div
    className="absolute inset-0 w-full h-full opacity-[0.07]"
    style={{
      backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
      backgroundSize: "40px 40px",
    }}
  />
);

/* ─── Floating stat card ─────────────────────────────────────────────────────── */
const StatCard = ({ value, label, sub, className = "" }) => (
  <div
    className={`absolute bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 shadow-xl animate-float ${className}`}
  >
    <div className="text-white font-black text-xl leading-none">{value}</div>
    <div className="text-white/70 text-xs font-medium mt-0.5">{label}</div>
    {sub && <div className="text-white/40 text-[10px] mt-0.5">{sub}</div>}
  </div>
);

/* ─── Feature Pill ───────────────────────────────────────────────────────────── */
const FeaturePill = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2 bg-white/[0.06] border border-white/10 rounded-full px-3.5 py-1.5 text-[11.5px] text-white/60 font-medium">
    <Icon size={13} className="opacity-70" />
    {label}
  </div>
);

/* ─── Main ───────────────────────────────────────────────────────────────────── */
const LoginForm = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/auth/login`, {
        email: form.email,
        password: form.password,
      });
      if (!res.data?.success)
        throw new Error(res.data?.error || "Login failed");
      localStorage.setItem("auth_user", JSON.stringify(res.data.data));
      toast.success("Welcome back! Redirecting…");
      setTimeout(() => navigate("/dashboard"), 700);
    } catch (error) {
      const msg =
        error.response?.data?.error || error.message || "Login failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Custom animations - minimal CSS needed for Tailwind */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.9); opacity: 0.6; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-shimmer {
          background: linear-gradient(90deg, #34d399, #6ee7b7, #a7f3d0, #34d399);
          background-size: 300% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
        .animate-rotate-slow { animation: rotate-slow 18s linear infinite; }
        .animate-rotate-slow-reverse { animation: rotate-slow 10s linear infinite reverse; }
        .animate-pulse-ring { animation: pulse-ring 2s ease-out infinite; }
        .animate-slide-up-1 { animation: slide-up 0.5s ease both 0.05s; }
        .animate-slide-up-2 { animation: slide-up 0.5s ease both 0.12s; }
        .animate-slide-up-3 { animation: slide-up 0.5s ease both 0.2s; }
        .animate-slide-up-4 { animation: slide-up 0.5s ease both 0.28s; }
        .animate-slide-up-5 { animation: slide-up 0.5s ease both 0.36s; }

        .font-playfair { font-family: 'Playfair Display', serif; }
        .font-dm-sans { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="flex min-h-screen font-dm-sans bg-[#0f0f10]">
        {/* ── LEFT PANEL ─────────────────────────────────────────────────── */}
        <div className="relative flex-[1.1] bg-gradient-to-br from-[#0d1b2a] via-[#1a2e1e] via-[70%] to-[#0a1a0d] overflow-hidden hidden md:flex flex-col justify-end p-14">
          <GridDots />
          
          {/* Orbs */}
          <div className="absolute -top-[120px] -left-[80px] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(52,211,153,0.18)_0%,transparent_70%)] pointer-events-none" />
          <div className="absolute bottom-[60px] -right-[100px] w-[380px] h-[380px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.12)_0%,transparent_70%)] pointer-events-none" />

          {/* Property image mosaic */}
          <div className="absolute top-0 left-0 right-0 h-[58%] grid grid-cols-[1.3fr_1fr] grid-rows-2 gap-[3px] opacity-55">
            <div
              className="row-span-2 bg-cover bg-center"
              style={{ backgroundImage: `url(${propertyImage1})` }}
            />
            <div
              className="bg-cover bg-center"
              style={{ backgroundImage: `url(${propertyImage2})` }}
            />
            <div
              className="bg-cover bg-center"
              style={{ backgroundImage: `url(${propertyImage3})` }}
            />
            {/* Overlay gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-[65%] bg-gradient-to-t from-[#0d1b2a] from-[30%] to-transparent" />
          </div>

          {/* Rotating ring decoration */}
          <div className="absolute top-[52px] right-[48px] w-20 h-20">
            <div className="absolute inset-0 rounded-full border-[1.5px] border-dashed border-emerald-400/35 animate-rotate-slow" />
            <div className="absolute inset-4 rounded-full border border-emerald-400/20 animate-rotate-slow-reverse" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]">
              <span className="absolute -inset-1 rounded-full bg-emerald-400/30 animate-pulse-ring" />
            </div>
          </div>

          {/* Floating stat card */}
          <StatCard
            value="2,840+"
            label="Properties Listed"
            sub="Across 12 cities"
            className="top-[46%] right-9"
          />

          {/* Bottom content */}
          <div className="relative z-10">
            {/* Tag */}
            <div className="inline-flex items-center gap-1.5 bg-emerald-400/15 border border-emerald-400/30 rounded-full px-3 py-1.5 text-[11px] font-semibold text-emerald-300 uppercase tracking-wider mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse-ring" />
              AI-Powered Property CRM
            </div>

            {/* Headline */}
            <h1 className="font-playfair text-[clamp(32px,3.2vw,48px)] font-black leading-[1.1] text-white mb-3.5">
              Close deals faster
              <br />
              with <em className="not-italic animate-shimmer">intelligent</em>
              <br />
              property insights
            </h1>

            {/* Description */}
            <p className="text-sm text-white/45 leading-relaxed max-w-[360px] mb-8 font-light">
              From lead capture to deal closure — your entire real estate
              workflow, powered by AI. Manage listings, track visits, and
              convert leads at scale.
            </p>

            {/* Feature pills */}
            <div className="flex gap-2 flex-wrap">
              <FeaturePill icon={Building2} label="Smart Listings" />
              <FeaturePill icon={BarChart3} label="Lead Analytics" />
              <FeaturePill icon={Bot} label="AI Assistant" />
              <FeaturePill icon={MapPin} label="Site Tracking" />
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ────────────────────────────────────────────────── */}
        <div className="w-full md:w-[480px] md:min-w-[380px] flex flex-col justify-center bg-[#fafaf8] px-8 py-14 md:px-[52px] relative overflow-hidden">
          {/* Background orb */}
          <div className="absolute -top-[200px] -right-[200px] w-[450px] h-[450px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.06)_0%,transparent_70%)] pointer-events-none" />

          <div className="relative z-10">
            {/* Logo */}
            <div className="flex items-center gap-2.5 mb-[52px] animate-slide-up-1">
              <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-emerald-600 to-emerald-400 flex items-center justify-center shadow-[0_4px_16px_rgba(52,211,153,0.35)]">
                <Home size={18} color="white" strokeWidth={2} />
              </div>
              <div className="font-playfair text-lg font-bold text-gray-900 tracking-tight">
                PropPilot <span className="text-emerald-600">CRM</span>
              </div>
            </div>

            {/* Heading */}
            <h2 className="font-playfair text-[32px] font-black text-gray-900 leading-[1.15] mb-1.5 animate-slide-up-2">
              Welcome
              <br />
              back.
            </h2>
            <p className="text-[13.5px] text-gray-400 mb-10 animate-slide-up-3">
              Sign in to your workspace
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div className="mb-5 animate-slide-up-3">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Email address
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 flex items-center">
                    <Mail size={15} strokeWidth={1.8} />
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@company.com"
                    required
                    disabled={loading}
                    autoComplete="email"
                    className="w-full pl-10 pr-3.5 py-3 bg-white border-[1.5px] border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-300 outline-none transition-all focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="mb-5 animate-slide-up-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 flex items-center">
                    <Lock size={15} strokeWidth={1.8} />
                  </span>
                  <input
                    type={showPass ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••••"
                    required
                    disabled={loading}
                    autoComplete="current-password"
                    className="w-full pl-10 pr-11 py-3 bg-white border-[1.5px] border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-300 outline-none transition-all focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 disabled:bg-gray-100 disabled:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    {showPass ? (
                      <EyeOff size={16} strokeWidth={1.8} />
                    ) : (
                      <Eye size={16} strokeWidth={1.8} />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot password */}
              <a
                href="#"
                className="block text-right text-xs text-emerald-600 font-medium hover:underline -mt-3 mb-2 animate-slide-up-4"
              >
                Forgot password?
              </a>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 rounded-xl text-[15px] font-semibold transition-all mt-2 animate-slide-up-5 ${
                  loading
                    ? "bg-emerald-100 text-emerald-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-600 to-emerald-400 text-white shadow-[0_6px_24px_rgba(52,211,153,0.35)] hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(52,211,153,0.45)] active:translate-y-0"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  "Sign in to Dashboard →"
                )}
              </button>
            </form>

            {/* Footer */}
            <p className="mt-8 text-center text-xs text-gray-400 animate-slide-up-5">
              Need access?{" "}
              <a href="#" className="text-emerald-600 font-medium hover:underline">
                Contact your administrator
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginForm;