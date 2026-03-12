import axios from "axios";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BASE_URL } from "./config";

/* ─── Animated background grid dots ─────────────────────────────────────────── */
const GridDots = () => (
  <svg
    className="absolute inset-0 w-full h-full opacity-[0.07]"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="1" fill="white" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid)" />
  </svg>
);

/* ─── Floating stat card ─────────────────────────────────────────────────────── */
const StatCard = ({ value, label, sub, style, delay = "0s" }) => (
  <div
    className="absolute bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 shadow-xl"
    style={{
      ...style,
      animation: `floatCard 6s ease-in-out infinite`,
      animationDelay: delay,
    }}
  >
    <div className="text-white font-black text-xl leading-none">{value}</div>
    <div className="text-white/70 text-xs font-medium mt-0.5">{label}</div>
    {sub && <div className="text-white/40 text-[10px] mt-0.5">{sub}</div>}
  </div>
);

/* ─── Eye icon ───────────────────────────────────────────────────────────────── */
const EyeIcon = ({ open }) =>
  open ? (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes floatCard {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes rotateSlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(0.9); opacity: 0.6; }
          100% { transform: scale(1.4); opacity: 0; }
        }

        .login-root {
          display: flex;
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          background: #0f0f10;
        }

        /* ── LEFT PANEL ── */
        .left-panel {
          position: relative;
          flex: 1.1;
          background: linear-gradient(145deg, #0d1b2a 0%, #1a2e1e 40%, #0d2318 70%, #0a1a0d 100%);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 56px 52px;
        }
        @media (max-width: 860px) { .left-panel { display: none; } }

        .left-panel__orb1 {
          position: absolute;
          top: -120px; left: -80px;
          width: 500px; height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(52,211,153,0.18) 0%, transparent 70%);
          pointer-events: none;
        }
        .left-panel__orb2 {
          position: absolute;
          bottom: 60px; right: -100px;
          width: 380px; height: 380px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%);
          pointer-events: none;
        }

        /* Property image mosaic */
        .mosaic {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 58%;
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          grid-template-rows: 1fr 1fr;
          gap: 3px;
          opacity: 0.55;
        }
        .mosaic__cell {
          overflow: hidden;
          background-size: cover;
          background-position: center;
        }
        .mosaic__cell:first-child { grid-row: span 2; }
        .mosaic__overlay {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 65%;
          background: linear-gradient(to top, #0d1b2a 30%, transparent);
        }

        /* Rotating ring decoration */
        .ring-deco {
          position: absolute;
          top: 52px; right: 48px;
          width: 80px; height: 80px;
        }
        .ring-deco__outer {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1.5px dashed rgba(52,211,153,0.35);
          animation: rotateSlow 18s linear infinite;
        }
        .ring-deco__inner {
          position: absolute;
          inset: 16px;
          border-radius: 50%;
          border: 1px solid rgba(52,211,153,0.2);
          animation: rotateSlow 10s linear infinite reverse;
        }
        .ring-deco__dot {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 10px; height: 10px;
          border-radius: 50%;
          background: #34d399;
          box-shadow: 0 0 12px rgba(52,211,153,0.8);
        }
        .ring-deco__dot::after {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          background: rgba(52,211,153,0.3);
          animation: pulse-ring 2s ease-out infinite;
        }

        .left-panel__tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(52,211,153,0.15);
          border: 1px solid rgba(52,211,153,0.3);
          border-radius: 100px;
          padding: 5px 12px;
          font-size: 11px;
          font-weight: 600;
          color: #6ee7b7;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 16px;
        }
        .left-panel__tag span {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #34d399;
          box-shadow: 0 0 8px #34d399;
          animation: pulse-ring 2s ease-out infinite;
          display: inline-block;
        }

        .left-panel__headline {
          font-family: 'Playfair Display', serif;
          font-size: clamp(32px, 3.2vw, 48px);
          font-weight: 900;
          line-height: 1.1;
          color: #ffffff;
          margin-bottom: 14px;
        }
        .left-panel__headline em {
          font-style: normal;
          background: linear-gradient(90deg, #34d399, #6ee7b7, #a7f3d0, #34d399);
          background-size: 300% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }

        .left-panel__desc {
          font-size: 14px;
          color: rgba(255,255,255,0.45);
          line-height: 1.65;
          max-width: 360px;
          margin-bottom: 32px;
          font-weight: 300;
        }

        .left-panel__pills {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 100px;
          padding: 6px 14px;
          font-size: 11.5px;
          color: rgba(255,255,255,0.6);
          font-weight: 500;
        }
        .pill svg { opacity: 0.7; }

        /* ── RIGHT PANEL ── */
        .right-panel {
          width: 480px;
          min-width: 380px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: #fafaf8;
          padding: 56px 52px;
          position: relative;
          overflow: hidden;
        }
        @media (max-width: 860px) {
          .right-panel { width: 100%; min-width: unset; }
          .login-root { background: #fafaf8; }
        }

        .right-panel::before {
          content: '';
          position: absolute;
          top: -200px; right: -200px;
          width: 450px; height: 450px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%);
          pointer-events: none;
        }

        /* Logo mark */
        .logo-mark {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 52px;
        }
        .logo-mark__icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #059669, #34d399);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 16px rgba(52,211,153,0.35);
        }
        .logo-mark__name {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 700;
          color: #111;
          letter-spacing: -0.3px;
        }
        .logo-mark__name span { color: #059669; }

        /* Form heading */
        .form-heading {
          font-family: 'Playfair Display', serif;
          font-size: 32px;
          font-weight: 900;
          color: #111;
          line-height: 1.15;
          margin-bottom: 6px;
        }
        .form-sub {
          font-size: 13.5px;
          color: #888;
          margin-bottom: 40px;
          font-weight: 400;
        }

        /* Form elements */
        .field-group { margin-bottom: 22px; }
        .field-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #555;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .field-wrap {
          position: relative;
        }
        .field-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #bbb;
          display: flex;
          align-items: center;
        }
        .field-input {
          width: 100%;
          padding: 13px 14px 13px 40px;
          background: #fff;
          border: 1.5px solid #e5e5e3;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: #111;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          -webkit-appearance: none;
        }
        .field-input::placeholder { color: #c0c0bc; }
        .field-input:focus {
          border-color: #34d399;
          box-shadow: 0 0 0 4px rgba(52,211,153,0.12);
        }
        .field-input:disabled { background: #f5f5f3; color: #aaa; }

        .eye-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #aaa;
          display: flex;
          align-items: center;
          padding: 4px;
          transition: color 0.15s;
        }
        .eye-btn:hover { color: #555; }

        /* Submit */
        .submit-btn {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
          margin-top: 8px;
        }
        .submit-btn--active {
          background: linear-gradient(135deg, #059669, #34d399);
          color: #fff;
          box-shadow: 0 6px 24px rgba(52,211,153,0.35);
        }
        .submit-btn--active:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 28px rgba(52,211,153,0.45);
        }
        .submit-btn--active:active { transform: translateY(0); }
        .submit-btn--loading {
          background: #d1fae5;
          color: #059669;
          cursor: not-allowed;
        }

        /* Loading spinner */
        .spinner {
          display: inline-block;
          width: 14px; height: 14px;
          border: 2px solid rgba(5,150,105,0.3);
          border-top-color: #059669;
          border-radius: 50%;
          animation: rotateSlow 0.7s linear infinite;
          margin-right: 8px;
          vertical-align: middle;
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 28px 0;
        }
        .divider__line { flex: 1; height: 1px; background: #e8e8e5; }
        .divider__text { font-size: 12px; color: #bbb; font-weight: 500; }

        .forgot-link {
          display: block;
          text-align: right;
          font-size: 12px;
          color: #059669;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
          margin-top: -12px;
          margin-bottom: 8px;
        }
        .forgot-link:hover { text-decoration: underline; }

        .footer-text {
          margin-top: 32px;
          text-align: center;
          font-size: 12px;
          color: #bbb;
        }
        .footer-text a { color: #059669; font-weight: 500; text-decoration: none; }

        /* Entrance animation */
        .animate-up-1 { animation: slideUp 0.5s ease both; animation-delay: 0.05s; }
        .animate-up-2 { animation: slideUp 0.5s ease both; animation-delay: 0.12s; }
        .animate-up-3 { animation: slideUp 0.5s ease both; animation-delay: 0.2s; }
        .animate-up-4 { animation: slideUp 0.5s ease both; animation-delay: 0.28s; }
        .animate-up-5 { animation: slideUp 0.5s ease both; animation-delay: 0.36s; }
        .animate-fade  { animation: fadeIn 0.8s ease both; animation-delay: 0.1s; }
      `}</style>

  

      <div className="login-root">
        {/* ── LEFT PANEL ─────────────────────────────────────────────────── */}
        <div className="left-panel">
          <GridDots />
          <div className="left-panel__orb1" />
          <div className="left-panel__orb2" />

          {/* Property image mosaic */}
          <div className="mosaic">
            <div
              className="mosaic__cell"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80')",
              }}
            />
            <div
              className="mosaic__cell"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80')",
              }}
            />
            <div
              className="mosaic__cell"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80')",
              }}
            />
            <div className="mosaic__overlay" />
          </div>

          {/* Rotating ring */}
          <div className="ring-deco">
            <div className="ring-deco__outer" />
            <div className="ring-deco__inner" />
            <div className="ring-deco__dot" />
          </div>

          {/* Floating stat cards */}
          <StatCard
            value="2,840+"
            label="Properties Listed"
            sub="Across 12 cities"
            style={{ top: "46%", right: "36px" }}
            delay="0s"
          />
          {/* Bottom content */}
          <div style={{ position: "relative", zIndex: 10 }}>
            <div className="left-panel__tag">
              <span /> AI-Powered Property CRM
            </div>
            <h1 className="left-panel__headline">
              Close deals faster
              <br />
              with <em>intelligent</em>
              <br />
              property insights
            </h1>
            <p className="left-panel__desc">
              From lead capture to deal closure — your entire real estate
              workflow, powered by AI. Manage listings, track visits, and
              convert leads at scale.
            </p>
            <div className="left-panel__pills">
              {[
                { icon: "🏢", label: "Smart Listings" },
                { icon: "📊", label: "Lead Analytics" },
                { icon: "🤖", label: "AI Assistant" },
                { icon: "📍", label: "Site Tracking" },
              ].map((p) => (
                <div key={p.label} className="pill">
                  <span>{p.icon}</span>
                  {p.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ────────────────────────────────────────────────── */}
        <div className="right-panel">
          <div>
            {/* Logo */}
            <div className="logo-mark animate-up-1">
              <div className="logo-mark__icon">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"
                    fill="white"
                    opacity="0.9"
                  />
                  <path
                    d="M9 21V12h6v9"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="logo-mark__name">
                PropPilot <span className="ml-1">CRM</span>
              </div>
            </div>

            {/* Heading */}
            <h2 className="form-heading animate-up-2">
              Welcome
              <br />
              back.
            </h2>
            <p className="form-sub animate-up-3">Sign in to your workspace</p>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div className="field-group animate-up-3">
                <label className="field-label">Email address</label>
                <div className="field-wrap">
                  <span className="field-icon">
                    <svg
                      width="15"
                      height="15"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      viewBox="0 0 24 24"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </span>
                  <input
                    className="field-input"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@company.com"
                    required
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="field-group animate-up-4">
                <label className="field-label">Password</label>
                <div className="field-wrap">
                  <span className="field-icon">
                    <svg
                      width="15"
                      height="15"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      viewBox="0 0 24 24"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    className="field-input"
                    type={showPass ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••••"
                    required
                    disabled={loading}
                    autoComplete="current-password"
                    style={{ paddingRight: "44px" }}
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowPass((p) => !p)}
                  >
                    <EyeIcon open={showPass} />
                  </button>
                </div>
              </div>

              <a href="#" className="forgot-link animate-up-4">
                Forgot password?
              </a>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className={`submit-btn animate-up-5 ${loading ? "submit-btn--loading" : "submit-btn--active"}`}
              >
                {loading ? (
                  <>
                    <span className="spinner" />
                    Signing in…
                  </>
                ) : (
                  "Sign in to Dashboard →"
                )}
              </button>
            </form>

            <p className="footer-text animate-up-5">
              Need access? <a href="#">Contact your administrator</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginForm;
