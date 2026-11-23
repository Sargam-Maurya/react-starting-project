import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  IndianRupee,
  Target,
  Clock,
  AlertTriangle,
  Banknote,
  Landmark,
  Wallet,
} from "lucide-react";
import { useData } from "../context/DataContext";
import PageHeader from "../components/ui/PageHeader";
import KpiCard from "../components/ui/KpiCard";
import Select from "../components/ui/Select";
import ChartCard from "../components/charts/ChartCard";
import { formatCurrency } from "../utils/formatters";

const DATE_RANGES = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "month", label: "This month" },
  { value: "all", label: "All time" },
];

const CHART_COLORS = ["#00237D", "#FEBB1C", "#4F7CDD", "#34A853", "#9334E8", "#EA6A1F"];

const DAY_MS = 24 * 60 * 60 * 1000;

function rangeStart(range) {
  const now = new Date();
  switch (range) {
    case "today":
      now.setHours(0, 0, 0, 0);
      return now;
    case "7d":
      return new Date(now.getTime() - 7 * DAY_MS);
    case "30d":
      return new Date(now.getTime() - 30 * DAY_MS);
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    default:
      return null;
  }
}

export default function Dashboard() {
  const { agents, customers, collections, deposits, branches } = useData();
  const [dateRange, setDateRange] = useState("30d");
  const [branchFilter, setBranchFilter] = useState("");

  const branchOptions = useMemo(
    () => [
      { value: "", label: "All Branches" },
      ...branches.map((b) => ({ value: b, label: b })),
    ],
    [branches]
  );

  const agentBranchMap = useMemo(
    () => Object.fromEntries(agents.map((a) => [a.id, a.branch])),
    [agents]
  );

  const inBranch = (branch) => !branchFilter || branch === branchFilter;

  const filteredCollections = useMemo(() => {
    const start = rangeStart(dateRange);
    return collections.filter(
      (c) => inBranch(c.branch) && (!start || new Date(c.paymentDate) >= start)
    );
  }, [collections, dateRange, branchFilter]);

  const filteredDeposits = useMemo(() => {
    const start = rangeStart(dateRange);
    return deposits.filter(
      (d) => inBranch(d.branch) && (!start || new Date(d.depositDate) >= start)
    );
  }, [deposits, dateRange, branchFilter]);

  const branchCustomers = useMemo(
    () => customers.filter((c) => inBranch(c.branch)),
    [customers, branchFilter]
  );

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const sum = (rows) => rows.reduce((acc, r) => acc + r.amount, 0);

    const collectionToday = sum(
      collections.filter(
        (c) => new Date(c.paymentDate) >= today && inBranch(c.branch)
      )
    );

    const monthlyTarget = agents
      .filter((a) => inBranch(a.branch))
      .reduce((acc, a) => acc + a.monthlyTarget, 0);

    const monthlyCollected = sum(
      collections.filter(
        (c) => new Date(c.paymentDate) >= monthStart && inBranch(c.branch)
      )
    );

    const pendingCustomers = branchCustomers.filter((c) => c.outstandingAmount > 0);
    const pendingEmi = pendingCustomers.reduce((acc, c) => acc + c.emiAmount, 0);
    const overdueAccounts = branchCustomers.filter((c) => c.overdueDays > 0).length;

    const cashCollected = sum(filteredCollections.filter((c) => c.mode === "Cash"));
    const cashDeposited = sum(
      filteredDeposits.filter((d) => d.status === "Approved")
    );

    return {
      collectionToday,
      monthlyTarget,
      monthlyCollected,
      pendingEmi,
      pendingCount: pendingCustomers.length,
      overdueAccounts,
      cashCollected,
      cashDeposited,
      cashInHand: cashCollected - cashDeposited,
    };
  }, [agents, collections, filteredCollections, filteredDeposits, branchCustomers, branchFilter]);

  // --- Chart data ---

  const dailyData = useMemo(() => {
    const start = rangeStart(dateRange) ?? new Date(Date.now() - 30 * DAY_MS);
    const days = Math.min(
      Math.max(Math.ceil((Date.now() - start.getTime()) / DAY_MS), 1),
      45
    );
    const buckets = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * DAY_MS);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = {
        date: key,
        label: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        total: 0,
      };
    }
    for (const c of filteredCollections) {
      const key = c.paymentDate.slice(0, 10);
      if (buckets[key]) buckets[key].total += c.amount;
    }
    return Object.values(buckets);
  }, [filteredCollections, dateRange]);

  const monthlyData = useMemo(() => {
    const buckets = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      buckets[key] = {
        month: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
        total: 0,
        target: 0,
      };
    }
    for (const c of collections) {
      if (!inBranch(c.branch)) continue;
      const key = c.paymentDate.slice(0, 7);
      if (buckets[key]) buckets[key].total += c.amount;
    }
    const monthlyTarget = agents
      .filter((a) => inBranch(a.branch))
      .reduce((acc, a) => acc + a.monthlyTarget, 0);
    for (const b of Object.values(buckets)) b.target = monthlyTarget;
    return Object.values(buckets);
  }, [collections, agents, branchFilter]);

  const agentChartData = useMemo(() => {
    const totals = {};
    for (const c of filteredCollections) {
      totals[c.agentName] = (totals[c.agentName] || 0) + c.amount;
    }
    return Object.entries(totals)
      .map(([name, total]) => ({ name: name.split(" ")[0], total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [filteredCollections]);

  const branchChartData = useMemo(() => {
    const totals = {};
    for (const c of filteredCollections) {
      totals[c.branch] = (totals[c.branch] || 0) + c.amount;
    }
    return Object.entries(totals).map(([name, value]) => ({ name, value }));
  }, [filteredCollections]);

  const currencyTick = (v) =>
    v >= 100000 ? `${(v / 100000).toFixed(1)}L` : `${Math.round(v / 1000)}k`;

  const targetProgress = stats.monthlyTarget
    ? Math.round((stats.monthlyCollected / stats.monthlyTarget) * 100)
    : 0;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Collection performance and cash position overview"
      >
        <Select
          name="dateRange"
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          options={DATE_RANGES}
          placeholder="Date range"
        />
        <Select
          name="branch"
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          options={branchOptions}
          placeholder="All Branches"
        />
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Collection Today"
          value={formatCurrency(stats.collectionToday)}
          icon={IndianRupee}
        />
        <KpiCard
          title="Monthly Target"
          value={formatCurrency(stats.monthlyTarget)}
          subtitle={`${targetProgress}% achieved (${formatCurrency(stats.monthlyCollected)})`}
          icon={Target}
        />
        <KpiCard
          title="Pending EMI"
          value={formatCurrency(stats.pendingEmi)}
          subtitle={`${stats.pendingCount} accounts`}
          icon={Clock}
        />
        <KpiCard
          title="Overdue Accounts"
          value={stats.overdueAccounts}
          subtitle="Accounts past due date"
          icon={AlertTriangle}
        />
        <KpiCard
          title="Cash Collected"
          value={formatCurrency(stats.cashCollected)}
          icon={Banknote}
        />
        <KpiCard
          title="Cash Deposited"
          value={formatCurrency(stats.cashDeposited)}
          subtitle="Verified deposits"
          icon={Landmark}
        />
        <KpiCard
          title="Cash in Hand"
          value={formatCurrency(stats.cashInHand)}
          subtitle="Held by agents"
          icon={Wallet}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard title="Daily Collection Performance" subtitle="Total amount collected per day">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tickFormatter={currencyTick} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="total" name="Collected" fill="#00237D" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Collection Trend" subtitle="Last 6 months vs target">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={currencyTick} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Legend />
              <Line type="monotone" dataKey="total" name="Collected" stroke="#00237D" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="target" name="Target" stroke="#FEBB1C" strokeWidth={2} strokeDasharray="6 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Agent-wise Performance" subtitle="Top collecting agents">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={agentChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis type="number" tickFormatter={currencyTick} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="total" name="Collected" fill="#FEBB1C" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Branch-wise Distribution" subtitle="Share of total collections">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={branchChartData}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={85}
                paddingAngle={3}
              >
                {branchChartData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Legend layout="vertical" align="right" verticalAlign="middle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
