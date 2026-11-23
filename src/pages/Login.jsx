import { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { Landmark } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../constants";
import { BRANCHES } from "../mock/seed";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";

const ROLES = ["Collection Agent", "Supervisor", "Collection Manager"];

export default function Login() {
  const { isAuthenticated, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Collection Agent",
    branch: BRANCHES[0],
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  function switchMode(next) {
    setMode(next);
    setErrors({});
    setApiError("");
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setApiError("");
  }

  function validate() {
    const next = {};
    if (mode === "register" && !form.name.trim()) next.name = "Name is required";
    if (!form.email.trim()) next.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) next.email = "Enter a valid email";
    if (!form.password) next.password = "Password is required";
    else if (mode === "register" && form.password.length < 6)
      next.password = "Password must be at least 6 characters";
    if (mode === "register" && form.confirmPassword !== form.password)
      next.confirmPassword = "Passwords do not match";
    return next;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      if (mode === "register") {
        await register({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          branch: form.branch,
        });
      } else {
        await login(form.email, form.password);
      }
      const destination = location.state?.from?.pathname ?? ROUTES.DASHBOARD;
      navigate(destination, { replace: true });
    } catch (err) {
      setApiError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-secondary">
              <Landmark size={30} />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">CollectOps</h1>
            <p className="mt-1 text-sm text-gray-500">
              {mode === "login"
                ? "Collection Operations & Cash Reconciliation"
                : "Create your demo account"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {apiError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                {apiError}
              </div>
            )}

            {mode === "register" && (
              <Input
                label="Full Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Rahul Sharma"
                error={errors.name}
                required
              />
            )}

            <Input
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@company.com"
              error={errors.email}
              required
            />
            <Input
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder={mode === "register" ? "Minimum 6 characters" : "Enter your password"}
              error={errors.password}
              required
            />

            {mode === "register" && (
              <>
                <Input
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  error={errors.confirmPassword}
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label="Role"
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    options={ROLES.map((r) => ({ value: r, label: r }))}
                  />
                  <Select
                    label="Branch"
                    name="branch"
                    value={form.branch}
                    onChange={handleChange}
                    options={BRANCHES.map((b) => ({ value: b, label: b }))}
                  />
                </div>
              </>
            )}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              {mode === "login" ? "Sign in" : "Create Account"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => switchMode("register")}
                  className="font-semibold text-primary hover:underline"
                >
                  Register
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => switchMode("login")}
                  className="font-semibold text-primary hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>

          {mode === "login" && (
            <div className="mt-6 rounded-lg bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Demo credentials
              </p>
              <div className="mt-2 space-y-1 text-xs text-gray-600">
                <p>
                  <span className="font-medium">Manager:</span>{" "}
                  manager@collectops.demo / demo123
                </p>
                <p>
                  <span className="font-medium">Supervisor:</span>{" "}
                  supervisor@collectops.demo / demo123
                </p>
              </div>
            </div>
          )}
        </div>
        <p className="mt-4 text-center text-xs text-white/50">
          Portfolio demo — fictional data only. Not affiliated with any real institution.
        </p>
      </div>
    </div>
  );
}
