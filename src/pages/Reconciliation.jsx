import { useState, useMemo } from "react";
import { Plus, FileSearch, Banknote, Landmark, Wallet, Clock } from "lucide-react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { useDebounce } from "../hooks/useDebounce";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import KpiCard from "../components/ui/KpiCard";
import DataTable from "../components/ui/DataTable";
import SearchInput from "../components/ui/SearchInput";
import Select from "../components/ui/Select";
import DepositFormModal from "../components/reconciliation/DepositFormModal";
import DepositReviewModal from "../components/reconciliation/DepositReviewModal";
import { formatCurrency, formatDate } from "../utils/formatters";
import { DEPOSIT_STATUS } from "../constants";

const HIGH_HOLDING_THRESHOLD = 50000;

export default function Reconciliation() {
  const { agents, collections, deposits, branches, addRecord, updateRecord, logAudit } =
    useData();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const debouncedSearch = useDebounce(search);

  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [reviewingDeposit, setReviewingDeposit] = useState(null);

  // Per-agent cash position: collected − verified deposits = cash in hand;
  // pending deposits additionally reduce what can still be deposited.
  const cashPositions = useMemo(
    () =>
      agents.map((agent) => {
        const cashCollected = collections
          .filter((c) => c.agentId === agent.id && c.mode === "Cash")
          .reduce((acc, c) => acc + c.amount, 0);
        const verifiedDeposits = deposits
          .filter((d) => d.agentId === agent.id && d.status === "Approved")
          .reduce((acc, d) => acc + d.amount, 0);
        const pendingDeposits = deposits
          .filter((d) => d.agentId === agent.id && d.status === "Pending")
          .reduce((acc, d) => acc + d.amount, 0);
        const cashInHand = cashCollected - verifiedDeposits;

        let flag = "Reconciled";
        if (cashInHand < 0) flag = "Mismatch";
        else if (cashInHand >= HIGH_HOLDING_THRESHOLD) flag = "High Holding";

        return {
          agent,
          cashCollected,
          verifiedDeposits,
          pendingDeposits,
          cashInHand,
          availableCash: cashInHand - pendingDeposits,
          flag,
        };
      }),
    [agents, collections, deposits]
  );

  const totals = useMemo(
    () => ({
      cashCollected: cashPositions.reduce((a, p) => a + p.cashCollected, 0),
      verifiedDeposits: cashPositions.reduce((a, p) => a + p.verifiedDeposits, 0),
      pendingDeposits: cashPositions.reduce((a, p) => a + p.pendingDeposits, 0),
      cashInHand: cashPositions.reduce((a, p) => a + p.cashInHand, 0),
      pendingCount: deposits.filter((d) => d.status === "Pending").length,
    }),
    [cashPositions, deposits]
  );

  const filteredDeposits = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return [...deposits]
      .sort((a, b) => new Date(b.depositDate) - new Date(a.depositDate))
      .filter(
        (d) =>
          (!q ||
            d.id.toLowerCase().includes(q) ||
            d.agentName.toLowerCase().includes(q) ||
            d.referenceNumber.toLowerCase().includes(q)) &&
          (!statusFilter || d.status === statusFilter) &&
          (!branchFilter || d.branch === branchFilter)
      );
  }, [deposits, debouncedSearch, statusFilter, branchFilter]);

  function handleSubmitDeposit(form) {
    const maxNum = Math.max(0, ...deposits.map((d) => parseInt(d.id.split("-")[1], 10)));
    const deposit = {
      ...form,
      id: `DEP-${String(maxNum + 1).padStart(4, "0")}`,
      status: "Pending",
      submittedBy: user?.name ?? "System",
      verifiedBy: null,
      rejectionReason: null,
      createdAt: new Date().toISOString(),
    };
    addRecord("deposits", deposit);
    logAudit(
      "Deposit Submitted",
      deposit.id,
      `Deposit of ₹${deposit.amount.toLocaleString("en-IN")} by ${deposit.agentName} (Ref: ${deposit.referenceNumber})`
    );
  }

  function handleApprove(deposit) {
    updateRecord("deposits", deposit.id, {
      status: "Approved",
      verifiedBy: user?.name ?? "Supervisor",
    });
    logAudit("Deposit Approved", deposit.id, `Verified deposit ${deposit.referenceNumber}`);
  }

  function handleReject(deposit, reason) {
    updateRecord("deposits", deposit.id, {
      status: "Rejected",
      verifiedBy: user?.name ?? "Supervisor",
      rejectionReason: reason,
    });
    logAudit("Deposit Rejected", deposit.id, reason);
  }

  const positionColumns = [
    { key: "agent", label: "Agent", sortable: true, sortValue: (r) => r.agent.name, render: (r) => r.agent.name },
    { key: "branch", label: "Branch", sortable: true, sortValue: (r) => r.agent.branch, render: (r) => r.agent.branch },
    {
      key: "cashCollected",
      label: "Cash Collected",
      sortable: true,
      render: (r) => formatCurrency(r.cashCollected),
    },
    {
      key: "verifiedDeposits",
      label: "Verified Deposits",
      sortable: true,
      render: (r) => formatCurrency(r.verifiedDeposits),
    },
    {
      key: "pendingDeposits",
      label: "Pending Deposits",
      sortable: true,
      render: (r) =>
        r.pendingDeposits > 0 ? (
          <span className="text-amber-600">{formatCurrency(r.pendingDeposits)}</span>
        ) : (
          "—"
        ),
    },
    {
      key: "cashInHand",
      label: "Cash in Hand",
      sortable: true,
      render: (r) => (
        <span className={`font-semibold ${r.cashInHand < 0 ? "text-red-600" : "text-gray-900"}`}>
          {formatCurrency(r.cashInHand)}
        </span>
      ),
    },
    {
      key: "flag",
      label: "Flag",
      sortable: true,
      render: (r) => (
        <Badge
          label={r.flag}
          color={
            r.flag === "Mismatch" ? "red" : r.flag === "High Holding" ? "yellow" : "green"
          }
        />
      ),
    },
  ];

  const depositColumns = [
    { key: "id", label: "Deposit ID", sortable: true },
    { key: "referenceNumber", label: "Reference No.", sortable: true },
    { key: "agentName", label: "Agent", sortable: true },
    { key: "branch", label: "Branch", sortable: true },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (r) => (
        <span className="font-semibold text-gray-900">{formatCurrency(r.amount)}</span>
      ),
    },
    {
      key: "depositDate",
      label: "Deposit Date",
      sortable: true,
      sortValue: (r) => new Date(r.depositDate).getTime(),
      render: (r) => formatDate(r.depositDate),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (r) => <Badge label={r.status} />,
    },
    { key: "submittedBy", label: "Submitted By", sortable: true },
    {
      key: "actions",
      label: "Actions",
      render: (r) => (
        <button
          onClick={() => setReviewingDeposit(r)}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary hover:bg-blue-50"
          title={r.status === "Pending" ? "Review deposit" : "View details"}
        >
          <FileSearch size={14} />
          {r.status === "Pending" ? "Review" : "View"}
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Cash Reconciliation"
        description="Agent cash positions, bank deposits and supervisor verification"
      >
        <Button onClick={() => setDepositModalOpen(true)}>
          <Plus size={16} /> Submit Deposit
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Cash Collected" value={formatCurrency(totals.cashCollected)} icon={Banknote} />
        <KpiCard title="Verified Deposits" value={formatCurrency(totals.verifiedDeposits)} icon={Landmark} />
        <KpiCard
          title="Pending Verification"
          value={formatCurrency(totals.pendingDeposits)}
          subtitle={`${totals.pendingCount} deposits`}
          icon={Clock}
        />
        <KpiCard title="Cash in Hand" value={formatCurrency(totals.cashInHand)} subtitle="Held by agents" icon={Wallet} />
      </div>

      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Agent Cash Positions
      </h2>
      <DataTable columns={positionColumns} data={cashPositions} />

      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Deposit Records
      </h2>
      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search deposit, agent, reference..."
          className="w-72"
        />
        <Select
          name="status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: "", label: "All Statuses" },
            ...Object.values(DEPOSIT_STATUS).map((s) => ({ value: s, label: s })),
          ]}
        />
        <Select
          name="branch"
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          options={[
            { value: "", label: "All Branches" },
            ...branches.map((b) => ({ value: b, label: b })),
          ]}
        />
      </div>
      <DataTable columns={depositColumns} data={filteredDeposits} />

      <DepositFormModal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        onSubmit={handleSubmitDeposit}
        cashPositions={cashPositions}
      />
      <DepositReviewModal
        isOpen={Boolean(reviewingDeposit)}
        onClose={() => setReviewingDeposit(null)}
        deposit={reviewingDeposit}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}
