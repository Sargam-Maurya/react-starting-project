import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";
import { ROUTES } from "./constants";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Agents from "./pages/Agents";
import Customers from "./pages/Customers";
import Collections from "./pages/Collections";
import Reconciliation from "./pages/Reconciliation";
import Reports from "./pages/Reports";
import AuditLogs from "./pages/AuditLogs";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path={ROUTES.LOGIN} element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path={ROUTES.AGENTS} element={<Agents />} />
              <Route path={ROUTES.CUSTOMERS} element={<Customers />} />
              <Route path={ROUTES.COLLECTIONS} element={<Collections />} />
              <Route path={ROUTES.RECONCILIATION} element={<Reconciliation />} />
              <Route path={ROUTES.REPORTS} element={<Reports />} />
              <Route path={ROUTES.AUDIT_LOGS} element={<AuditLogs />} />
            </Route>
          </Route>

          <Route path="/home" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
