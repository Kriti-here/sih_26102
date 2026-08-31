import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Map,
  Building2,
  Users,
  TableProperties,
  Bell,
  ShieldCheck,
  Database,
} from "lucide-react";

const NAV = [
  { to: "/", label: "Ministry Overview", icon: LayoutDashboard, end: true },
  { to: "/state", label: "State Nodal Authority", icon: Map },
  { to: "/district", label: "District Authority", icon: Building2 },
  { to: "/mp", label: "MP View", icon: Users },
  { to: "/register", label: "Works Register", icon: TableProperties },
  { to: "/alerts", label: "Alerts Feed", icon: Bell },
];

export function Layout({
  onSeed,
  seeding,
  alertCount,
  storage,
}: {
  onSeed: () => void;
  seeding: boolean;
  alertCount: number;
  storage: string;
}) {
  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col bg-[#1e293b] text-slate-300">
        <div className="flex items-center gap-2.5 border-b border-slate-700/60 px-5 py-4">
          <div className="rounded-md bg-sky-600 p-1.5">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white">MPLADS Sentinel</h1>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Anomaly Detection</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                  isActive
                    ? "bg-sky-600/90 font-medium text-white"
                    : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                }`
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.to === "/alerts" && alertCount > 0 && (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{alertCount}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-700/60 px-4 py-3">
          <button
            onClick={onSeed}
            disabled={seeding}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-slate-700 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-600 disabled:opacity-50"
          >
            <Database className="h-3.5 w-3.5" />
            {seeding ? "Seeding..." : "Reseed Dataset"}
          </button>
          <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
            SIH 2026 · PS SIH26102 · MoSPI
          </p>
        </div>
      </aside>

      {/* Main */}
      <div className="ml-64 flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-6 py-3 backdrop-blur">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">MPLADS Sentinel</p>
            <p className="text-sm font-semibold text-slate-700">AI-Powered Monitoring &amp; Analytics Platform</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-600">{storage}</span>
            <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-[11px] font-medium text-amber-800">
              SYNTHETIC DEMO DATA — prototype for SIH 2026, not connected to live MPLADS systems
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
