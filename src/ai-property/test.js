import { useState, useMemo } from "react";
import {
  Building2, Users, BarChart3, Activity, ShieldCheck,
  TrendingUp, Settings, LogOut, Menu, X, Bell,
  ChevronRight, CheckCircle, XCircle, Crown, Zap,
  Globe, ArrowUpRight, ArrowDownRight, Eye, Star,
  ToggleLeft, ToggleRight, Search, Filter, MoreVertical,
  Plus, Download, RefreshCw, AlertTriangle, Package,
  Home, Layers, Lock, Unlock, DollarSign
} from "lucide-react";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const MOCK_DEALERS = [
  { id: 1, name: "ABC Properties", slug: "abc-properties", owner: "Raj Sharma", email: "raj@abc.com", city: "Noida", plan: "PRO", status: "ACTIVE", leads: 342, visits: 1820, joinedAt: "2024-01-10", logo: null },
  { id: 2, name: "Elite Realty", slug: "elite-realty", owner: "Priya Mehta", email: "priya@elite.com", city: "Mumbai", plan: "BASIC", status: "ACTIVE", leads: 189, visits: 940, joinedAt: "2024-02-14", logo: null },
  { id: 3, name: "Dream Homes", slug: "dream-homes", owner: "Arjun Singh", email: "arjun@dream.com", city: "Delhi", plan: "ENTERPRISE", status: "ACTIVE", leads: 621, visits: 3100, joinedAt: "2023-11-05", logo: null },
  { id: 4, name: "Green Spaces", slug: "green-spaces", owner: "Neha Kapoor", email: "neha@green.com", city: "Pune", plan: "PRO", status: "INACTIVE", leads: 45, visits: 210, joinedAt: "2024-03-22", logo: null },
  { id: 5, name: "Urban Nests", slug: "urban-nests", owner: "Vikram Patel", email: "vikram@urban.com", city: "Bangalore", plan: "BASIC", status: "ACTIVE", leads: 278, visits: 1340, joinedAt: "2024-01-30", logo: null },
  { id: 6, name: "Royal Estates", slug: "royal-estates", owner: "Ananya Roy", email: "ananya@royal.com", city: "Hyderabad", plan: "ENTERPRISE", status: "ACTIVE", leads: 510, visits: 2600, joinedAt: "2023-09-18", logo: null },
];

const PLAN_CONFIG = {
  BASIC:      { color: "from-gray-400 to-gray-600",   badge: "bg-gray-100 text-gray-700",   features: ["5 Properties", "Basic Chat", "Email Support"] },
  PRO:        { color: "from-blue-500 to-indigo-600",  badge: "bg-blue-100 text-blue-700",   features: ["50 Properties", "AI Chat", "Bulk Marketing", "Priority Support"] },
  ENTERPRISE: { color: "from-amber-400 to-orange-500", badge: "bg-amber-100 text-amber-700", features: ["Unlimited Properties", "AI Chat", "Bulk Marketing", "Analytics", "Dedicated Support", "Custom Domain"] },
};

const SYSTEM_STATS = {
  totalDealers: 6, activeDealers: 5, totalLeads: 1985, totalVisits: 10010,
  monthlyRevenue: 284000, growth: 18.4
};

// ─── NAV CONFIG ───────────────────────────────────────────────────────────────

const SUPER_ADMIN_NAV = [
  { id: "overview",       label: "Overview",          icon: Home,        description: "System-wide stats" },
  { id: "dealers",        label: "Manage Dealers",    icon: Building2,   description: "Activate / deactivate dealers" },
  { id: "subscriptions",  label: "Subscriptions",     icon: DollarSign,  description: "Manage dealer plans" },
  { id: "analytics",      label: "Performance",       icon: BarChart3,   description: "Dealer analytics" },
  { id: "leads-visits",   label: "Leads & Visits",    icon: Activity,    description: "Monitor lead flow" },
  { id: "top-dealers",    label: "Top Dealers",       icon: Star,        description: "Leaderboard" },
  { id: "feature-access", label: "Feature Access",    icon: Layers,      description: "Plan-based control" },
  { id: "create-dealer",  label: "Create Dealer",     icon: Plus,        description: "Onboard new dealer" },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const PlanBadge = ({ plan }) => (
  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PLAN_CONFIG[plan]?.badge}`}>{plan}</span>
);

const StatusDot = ({ status }) => (
  <span className={`flex items-center gap-1 text-xs font-semibold ${status === "ACTIVE" ? "text-emerald-600" : "text-red-500"}`}>
    <span className={`w-2 h-2 rounded-full ${status === "ACTIVE" ? "bg-emerald-500 animate-pulse" : "bg-red-400"}`} />
    {status}
  </span>
);

const StatCard = ({ icon: Icon, label, value, sub, trend, color = "from-blue-500 to-indigo-600" }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow`}>
        <Icon size={20} className="text-white" />
      </div>
      {trend !== undefined && (
        <span className={`flex items-center gap-0.5 text-xs font-semibold ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
          {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div className="text-2xl font-black text-gray-900">{value}</div>
    <div className="text-sm font-medium text-gray-500 mt-0.5">{label}</div>
    {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
  </div>
);

// ─── VIEWS ────────────────────────────────────────────────────────────────────

const Overview = () => (
  <div className="p-6 space-y-6">
    <div>
      <h1 className="text-2xl font-black text-gray-900">System Overview</h1>
      <p className="text-gray-500 text-sm mt-1">Real-time platform statistics across all dealers</p>
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <StatCard icon={Building2} label="Total Dealers"   value={SYSTEM_STATS.totalDealers}   color="from-indigo-500 to-violet-600" />
      <StatCard icon={CheckCircle} label="Active"        value={SYSTEM_STATS.activeDealers}   color="from-emerald-500 to-green-600" />
      <StatCard icon={Activity} label="Total Leads"      value={SYSTEM_STATS.totalLeads.toLocaleString()} trend={12.3} color="from-blue-500 to-cyan-600" />
      <StatCard icon={Eye} label="Total Visits"          value={SYSTEM_STATS.totalVisits.toLocaleString()} trend={8.1} color="from-purple-500 to-pink-600" />
      <StatCard icon={DollarSign} label="Monthly Revenue" value={`₹${(SYSTEM_STATS.monthlyRevenue/1000).toFixed(0)}K`} trend={SYSTEM_STATS.growth} color="from-amber-400 to-orange-500" />
      <StatCard icon={TrendingUp} label="Growth"         value={`${SYSTEM_STATS.growth}%`}   color="from-rose-500 to-red-600" />
    </div>

    {/* Plan Distribution */}
    <div className="grid md:grid-cols-3 gap-4">
      {Object.entries(PLAN_CONFIG).map(([plan, cfg]) => {
        const count = MOCK_DEALERS.filter(d => d.plan === plan).length;
        return (
          <div key={plan} className={`bg-gradient-to-br ${cfg.color} rounded-2xl p-5 text-white shadow-lg`}>
            <div className="flex items-center justify-between mb-4">
              <Crown size={22} className="opacity-80" />
              <span className="text-3xl font-black">{count}</span>
            </div>
            <div className="font-bold text-lg">{plan}</div>
            <div className="text-white/70 text-xs mt-1">
              {cfg.features.slice(0, 2).join(" · ")}
            </div>
          </div>
        );
      })}
    </div>

    {/* Recent Dealers */}
    <div className="bg-white rounded-2xl border shadow-sm">
      <div className="p-5 border-b flex items-center justify-between">
        <h2 className="font-bold text-gray-800">Recent Dealers</h2>
        <span className="text-xs text-gray-400">Last 6 onboarded</span>
      </div>
      <div className="divide-y">
        {MOCK_DEALERS.slice(0,4).map(d => (
          <div key={d.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
              {d.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-800 text-sm truncate">{d.name}</div>
              <div className="text-xs text-gray-400">{d.city} · {d.owner}</div>
            </div>
            <PlanBadge plan={d.plan} />
            <StatusDot status={d.status} />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────

const ManageDealers = () => {
  const [dealers, setDealers] = useState(MOCK_DEALERS);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const filtered = useMemo(() => dealers.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.city.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "ALL" || d.status === filterStatus;
    return matchSearch && matchStatus;
  }), [dealers, search, filterStatus]);

  const toggle = (id) => setDealers(prev => prev.map(d => d.id === id ? { ...d, status: d.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" } : d));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Manage Dealers</h1>
          <p className="text-sm text-gray-500 mt-1">Activate, deactivate and monitor dealers</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold shadow hover:opacity-90 transition">
          <Download size={15} /> Export
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white border rounded-xl px-3 py-2 flex-1 min-w-48 shadow-sm">
          <Search size={16} className="text-gray-400" />
          <input className="outline-none text-sm w-full" placeholder="Search dealers..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {["ALL","ACTIVE","INACTIVE"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${filterStatus === s ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["Dealer","Owner","City","Plan","Status","Leads","Visits","Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(d => (
                <tr key={d.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs">{d.name[0]}</div>
                      <div>
                        <div className="font-semibold text-gray-800">{d.name}</div>
                        <div className="text-xs text-gray-400">{d.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{d.owner}</td>
                  <td className="px-4 py-3 text-gray-700">{d.city}</td>
                  <td className="px-4 py-3"><PlanBadge plan={d.plan} /></td>
                  <td className="px-4 py-3"><StatusDot status={d.status} /></td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{d.leads}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{d.visits}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggle(d.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${d.status === "ACTIVE" ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}>
                      {d.status === "ACTIVE" ? <><ToggleRight size={14}/>Deactivate</> : <><ToggleLeft size={14}/>Activate</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-12 text-gray-400">No dealers found</div>}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const Subscriptions = () => {
  const [dealers, setDealers] = useState(MOCK_DEALERS);
  const [editId, setEditId] = useState(null);

  const changePlan = (id, plan) => {
    setDealers(prev => prev.map(d => d.id === id ? { ...d, plan } : d));
    setEditId(null);
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Dealer Subscriptions</h1>
        <p className="text-sm text-gray-500 mt-1">Manage and upgrade dealer subscription plans</p>
      </div>

      {/* Plan Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        {Object.entries(PLAN_CONFIG).map(([plan, cfg]) => {
          const count = dealers.filter(d => d.plan === plan).length;
          return (
            <div key={plan} className="bg-white rounded-2xl border shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cfg.color} flex items-center justify-center`}>
                  <Crown size={18} className="text-white" />
                </div>
                <span className="text-3xl font-black text-gray-900">{count}</span>
              </div>
              <div className="font-bold text-gray-800">{plan}</div>
              <ul className="mt-3 space-y-1">
                {cfg.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle size={12} className="text-emerald-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Dealer Plan Table */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-5 border-b font-bold text-gray-800">Dealer Plans</div>
        <div className="divide-y">
          {dealers.map(d => (
            <div key={d.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">{d.name[0]}</div>
              <div className="flex-1">
                <div className="font-semibold text-gray-800 text-sm">{d.name}</div>
                <div className="text-xs text-gray-400">{d.owner} · {d.city}</div>
              </div>
              <div className="flex items-center gap-3">
                <PlanBadge plan={d.plan} />
                {editId === d.id ? (
                  <div className="flex gap-2">
                    {Object.keys(PLAN_CONFIG).map(p => (
                      <button key={p} onClick={() => changePlan(d.id, p)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${d.plan === p ? "bg-indigo-600 text-white border-indigo-600" : "text-gray-600 border-gray-200 hover:bg-gray-50"}`}>
                        {p}
                      </button>
                    ))}
                    <button onClick={() => setEditId(null)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
                  </div>
                ) : (
                  <button onClick={() => setEditId(d.id)}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
                    <Settings size={12}/> Change
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const Performance = () => (
  <div className="p-6 space-y-5">
    <div>
      <h1 className="text-2xl font-black text-gray-900">Dealer Performance</h1>
      <p className="text-sm text-gray-500 mt-1">Analytics across all dealers on the platform</p>
    </div>
    <div className="grid md:grid-cols-2 gap-4">
      {MOCK_DEALERS.map(d => {
        const convRate = ((d.leads / d.visits) * 100).toFixed(1);
        const leadsWidth = Math.min((d.leads / 700) * 100, 100);
        const visitsWidth = Math.min((d.visits / 3200) * 100, 100);
        return (
          <div key={d.id} className="bg-white rounded-2xl border shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold">{d.name[0]}</div>
              <div className="flex-1">
                <div className="font-bold text-gray-800">{d.name}</div>
                <div className="text-xs text-gray-400">{d.city}</div>
              </div>
              <PlanBadge plan={d.plan} />
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Leads</span><span className="font-bold text-gray-800">{d.leads}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all" style={{ width: `${leadsWidth}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Visits</span><span className="font-bold text-gray-800">{d.visits}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 transition-all" style={{ width: `${visitsWidth}%` }} />
                </div>
              </div>
              <div className="flex justify-between items-center pt-1 border-t mt-2">
                <span className="text-xs text-gray-500">Conversion Rate</span>
                <span className={`text-sm font-black ${parseFloat(convRate) > 15 ? "text-emerald-600" : "text-amber-600"}`}>{convRate}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────

const LeadsVisits = () => {
  const totalLeads  = MOCK_DEALERS.reduce((s, d) => s + d.leads, 0);
  const totalVisits = MOCK_DEALERS.reduce((s, d) => s + d.visits, 0);

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Leads & Visits Monitor</h1>
        <p className="text-sm text-gray-500 mt-1">Platform-wide lead and visit data</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Activity}  label="Total Leads"      value={totalLeads}        color="from-blue-500 to-indigo-600" trend={12.3} />
        <StatCard icon={Eye}       label="Total Visits"     value={totalVisits}       color="from-purple-500 to-pink-600" trend={8.7} />
        <StatCard icon={TrendingUp} label="Avg Conv. Rate"  value={((totalLeads/totalVisits)*100).toFixed(1)+"%"} color="from-emerald-500 to-green-600" />
        <StatCard icon={Building2} label="Active Dealers"   value={MOCK_DEALERS.filter(d=>d.status==="ACTIVE").length} color="from-amber-400 to-orange-500" />
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-5 border-b font-bold text-gray-800">Dealer Breakdown</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["Dealer","City","Plan","Leads","Visits","Conv. Rate","Lead Share"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {MOCK_DEALERS.sort((a,b) => b.leads - a.leads).map(d => {
                const conv = ((d.leads / d.visits) * 100).toFixed(1);
                const share = ((d.leads / totalLeads) * 100).toFixed(1);
                return (
                  <tr key={d.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">{d.name[0]}</div>
                        <span className="font-medium text-gray-800">{d.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{d.city}</td>
                    <td className="px-4 py-3"><PlanBadge plan={d.plan} /></td>
                    <td className="px-4 py-3 font-bold text-blue-600">{d.leads}</td>
                    <td className="px-4 py-3 font-bold text-purple-600">{d.visits}</td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${parseFloat(conv) > 15 ? "text-emerald-600" : "text-amber-600"}`}>{conv}%</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-20">
                          <div className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600" style={{ width: `${share}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{share}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const TopDealers = () => {
  const ranked = [...MOCK_DEALERS].sort((a,b) => b.leads - a.leads);
  const medals = ["🥇","🥈","🥉"];

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Top Performing Dealers</h1>
        <p className="text-sm text-gray-500 mt-1">Ranked by total leads generated</p>
      </div>

      {/* Podium top 3 */}
      <div className="grid grid-cols-3 gap-4">
        {ranked.slice(0,3).map((d, i) => (
          <div key={d.id} className={`bg-white rounded-2xl border shadow-sm p-5 text-center relative overflow-hidden ${i === 0 ? "border-amber-200 bg-gradient-to-b from-amber-50 to-white" : ""}`}>
            <div className="text-3xl mb-2">{medals[i]}</div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl font-black mx-auto mb-3">
              {d.name[0]}
            </div>
            <div className="font-bold text-gray-900">{d.name}</div>
            <div className="text-xs text-gray-400 mb-3">{d.city}</div>
            <div className="text-3xl font-black text-indigo-600">{d.leads}</div>
            <div className="text-xs text-gray-500">leads</div>
            <div className="mt-2"><PlanBadge plan={d.plan} /></div>
          </div>
        ))}
      </div>

      {/* Rest */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-5 border-b font-bold text-gray-800">Full Leaderboard</div>
        <div className="divide-y">
          {ranked.map((d, i) => (
            <div key={d.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black ${i < 3 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}>
                {i < 3 ? medals[i] : `#${i+1}`}
              </div>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs">{d.name[0]}</div>
              <div className="flex-1">
                <div className="font-semibold text-gray-800 text-sm">{d.name}</div>
                <div className="text-xs text-gray-400">{d.city} · {d.owner}</div>
              </div>
              <PlanBadge plan={d.plan} />
              <div className="text-right">
                <div className="font-black text-indigo-600">{d.leads}</div>
                <div className="text-xs text-gray-400">leads</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-purple-600">{d.visits}</div>
                <div className="text-xs text-gray-400">visits</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const FEATURES_LIST = [
  { id: "ai_chat",        label: "AI Chat Assistant",    icon: "🤖", plans: ["PRO", "ENTERPRISE"] },
  { id: "bulk_marketing", label: "Bulk Marketing",        icon: "📣", plans: ["PRO", "ENTERPRISE"] },
  { id: "analytics",      label: "Advanced Analytics",   icon: "📊", plans: ["ENTERPRISE"] },
  { id: "custom_domain",  label: "Custom Domain",         icon: "🌐", plans: ["ENTERPRISE"] },
  { id: "basic_listing",  label: "Property Listing",      icon: "🏠", plans: ["BASIC","PRO","ENTERPRISE"] },
  { id: "email_support",  label: "Email Support",         icon: "📧", plans: ["BASIC","PRO","ENTERPRISE"] },
  { id: "priority_support",label: "Priority Support",     icon: "⚡", plans: ["PRO","ENTERPRISE"] },
  { id: "api_access",     label: "API Access",            icon: "🔌", plans: ["ENTERPRISE"] },
];

const FeatureAccess = () => {
  const [features, setFeatures] = useState(FEATURES_LIST);

  const togglePlan = (featureId, plan) => {
    setFeatures(prev => prev.map(f => {
      if (f.id !== featureId) return f;
      const has = f.plans.includes(plan);
      return { ...f, plans: has ? f.plans.filter(p => p !== plan) : [...f.plans, plan] };
    }));
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Feature Access Control</h1>
        <p className="text-sm text-gray-500 mt-1">Control which features are available per subscription plan</p>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-5 py-4 font-semibold text-gray-600">Feature</th>
                {Object.keys(PLAN_CONFIG).map(p => (
                  <th key={p} className="text-center px-5 py-4 font-semibold text-gray-600">
                    <PlanBadge plan={p} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {features.map(f => (
                <tr key={f.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{f.icon}</span>
                      <span className="font-medium text-gray-800">{f.label}</span>
                    </div>
                  </td>
                  {Object.keys(PLAN_CONFIG).map(plan => {
                    const has = f.plans.includes(plan);
                    return (
                      <td key={plan} className="px-5 py-3.5 text-center">
                        <button onClick={() => togglePlan(f.id, plan)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition ${has ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-gray-100 text-gray-300 hover:bg-gray-200"}`}>
                          {has ? <Unlock size={16}/> : <Lock size={16}/>}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-gray-400 flex items-center gap-1.5">
        <AlertTriangle size={12}/> Changes here affect all dealers on the corresponding plan in real-time.
      </p>
    </div>
  );
};

// ─── PLACEHOLDER CREATE DEALER (simplified for standalone) ────────────────────

const CreateDealerPlaceholder = () => (
  <div className="p-6">
    <h1 className="text-2xl font-black text-gray-900 mb-2">Create Property Dealer</h1>
    <p className="text-gray-500 text-sm mb-6">Onboard a new dealer and instantly generate their website</p>
    <div className="bg-white rounded-2xl border shadow-sm p-8 text-center text-gray-400">
      <Building2 size={40} className="mx-auto mb-3 opacity-40" />
      <p className="font-medium">Your existing <code className="text-sm bg-gray-100 px-1 rounded">CreateDealer</code> component renders here.</p>
    </div>
  </div>
);

// ─── VIEW REGISTRY ────────────────────────────────────────────────────────────

const VIEW_MAP = {
  "overview":       <Overview />,
  "dealers":        <ManageDealers />,
  "subscriptions":  <Subscriptions />,
  "analytics":      <Performance />,
  "leads-visits":   <LeadsVisits />,
  "top-dealers":    <TopDealers />,
  "feature-access": <FeatureAccess />,
  "create-dealer":  <CreateDealerPlaceholder />,
};

// ─── MAIN LAYOUT ──────────────────────────────────────────────────────────────

export default function SuperAdminDashboard() {
  const [currentView, setCurrentView] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const currentItem = SUPER_ADMIN_NAV.find(n => n.id === currentView);
  const Icon = currentItem?.icon || Home;

  const navigate = (id) => {
    setCurrentView(id);
    setSidebarOpen(false);
  };

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div className={`p-5 border-b border-gray-100 flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
          <ShieldCheck size={20} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <div className="font-black text-gray-900 leading-none">PropertyAI</div>
            <div className="text-xs text-indigo-600 font-semibold mt-0.5">SUPER ADMIN</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {SUPER_ADMIN_NAV.map(item => {
          const NavIcon = item.icon;
          const active = currentView === item.id;
          return (
            <button key={item.id} onClick={() => navigate(item.id)}
              className={`w-full flex items-center rounded-xl transition-all group ${collapsed ? "justify-center px-3 py-3" : "gap-3 px-3 py-3"} ${active ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-100"}`}
              title={collapsed ? item.label : undefined}>
              <NavIcon size={18} className="shrink-0" />
              {!collapsed && (
                <div className="flex-1 text-left">
                  <div className="text-sm font-semibold leading-none">{item.label}</div>
                  <div className={`text-xs mt-0.5 ${active ? "text-white/70" : "text-gray-400"}`}>{item.description}</div>
                </div>
              )}
              {!collapsed && active && <ChevronRight size={14} className="opacity-60" />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`p-3 border-t border-gray-100 space-y-1`}>
        <button onClick={() => setCollapsed(c => !c)}
          className={`w-full flex items-center rounded-xl px-3 py-2.5 text-gray-500 hover:bg-gray-100 transition ${collapsed ? "justify-center" : "gap-3"}`}>
          {collapsed ? <ChevronRight size={16}/> : <><Menu size={16}/><span className="text-sm font-medium">Collapse</span></>}
        </button>
        <button className={`w-full flex items-center rounded-xl px-3 py-2.5 text-red-500 hover:bg-red-50 transition ${collapsed ? "justify-center" : "gap-3"}`}>
          <LogOut size={16}/>
          {!collapsed && <span className="text-sm font-semibold">Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="h-screen flex bg-gray-50 font-sans">
      {/* Desktop Sidebar */}
      <div className={`hidden md:flex flex-col bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ${collapsed ? "w-16" : "w-64"}`}>
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-white h-full flex flex-col shadow-2xl">
            <SidebarContent />
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-4 shrink-0">
          <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} className="text-gray-600" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <Icon size={14} className="text-white" />
            </div>
            <span className="font-bold text-gray-800">{currentItem?.label}</span>
          </div>
          <button className="relative w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
            <Bell size={17} className="text-gray-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow">
            SA
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {VIEW_MAP[currentView]}
        </div>
      </div>
    </div>
  );
}