import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Landmark,
  Contact,
  FileBarChart,
  ScrollText,
  Landmark as BrandIcon,
} from "lucide-react";
import { ROUTES } from "../../constants";

const NAV_ITEMS = [
  { label: "Dashboard", path: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: "Agents", path: ROUTES.AGENTS, icon: Users },
  { label: "Collections", path: ROUTES.COLLECTIONS, icon: Wallet },
  { label: "Reconciliation", path: ROUTES.RECONCILIATION, icon: Landmark },
  { label: "Customers", path: ROUTES.CUSTOMERS, icon: Contact },
  { label: "Reports", path: ROUTES.REPORTS, icon: FileBarChart },
  { label: "Audit Logs", path: ROUTES.AUDIT_LOGS, icon: ScrollText },
];

export default function Sidebar({ collapsed, mobileOpen, onCloseMobile }) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-primary text-white transition-all duration-300 lg:static ${
          collapsed ? "lg:w-20" : "lg:w-64"
        } w-64 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary-dark">
            <BrandIcon size={20} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-base font-bold">CollectOps</p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-white/50">
                Collection Operations
              </p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === ROUTES.DASHBOARD}
              onClick={onCloseMobile}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-secondary text-primary-dark"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                } ${collapsed ? "justify-center" : ""}`
              }
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {!collapsed && (
          <div className="border-t border-white/10 p-4">
            <p className="text-[10px] text-white/40">
              Demo build — fictional data only
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
