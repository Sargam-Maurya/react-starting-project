import { useState, useMemo } from "react";
import { Pencil } from "lucide-react";
import { useData } from "../context/DataContext";
import { useDebounce } from "../hooks/useDebounce";
import PageHeader from "../components/ui/PageHeader";
import Badge from "../components/ui/Badge";
import DataTable from "../components/ui/DataTable";
import SearchInput from "../components/ui/SearchInput";
import Select from "../components/ui/Select";
import CustomerFormModal from "../components/customers/CustomerFormModal";
import { formatCurrency, formatDate } from "../utils/formatters";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "Active", label: "Active" },
  { value: "Overdue", label: "Overdue" },
];

export default function Customers() {
  const { customers, agents, branches, updateRecord, logAudit } = useData();

  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [agentFilter, setAgentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const debouncedSearch = useDebounce(search);

  const [editingCustomer, setEditingCustomer] = useState(null);

  const agentMap = useMemo(
    () => Object.fromEntries(agents.map((a) => [a.id, a.name])),
    [agents]
  );

  const rows = useMemo(
    () =>
      customers.map((c) => ({
        ...c,
        agentName: c.agentId ? agentMap[c.agentId] ?? "—" : "Unassigned",
      })),
    [customers, agentMap]
  );

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return rows.filter(
      (r) =>
        (!q ||
          r.name.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.loanAccountNumber.toLowerCase().includes(q) ||
          r.phone.toLowerCase().includes(q)) &&
        (!branchFilter || r.branch === branchFilter) &&
        (!agentFilter ||
          (agentFilter === "unassigned" ? !r.agentId : r.agentId === agentFilter)) &&
        (!statusFilter || r.status === statusFilter)
    );
  }, [rows, debouncedSearch, branchFilter, agentFilter, statusFilter]);

  function handleSaveCustomer(updates) {
    updateRecord("customers", editingCustomer.id, updates);
    logAudit(
      "Customer Updated",
      editingCustomer.id,
      `Updated information for ${updates.name}`
    );
    setEditingCustomer(null);
  }

  const columns = [
    { key: "id", label: "Customer ID", sortable: true },
    { key: "name", label: "Name", sortable: true },
    { key: "loanAccountNumber", label: "Loan Account", sortable: true },
    {
      key: "loanAmount",
      label: "Loan Amount",
      sortable: true,
      render: (r) => formatCurrency(r.loanAmount),
    },
    {
      key: "emiAmount",
      label: "EMI",
      sortable: true,
      render: (r) => formatCurrency(r.emiAmount),
    },
    {
      key: "dueDate",
      label: "Due Date",
      sortable: true,
      render: (r) => formatDate(r.dueDate),
    },
    {
      key: "outstandingAmount",
      label: "Outstanding",
      sortable: true,
      render: (r) => formatCurrency(r.outstandingAmount),
    },
    {
      key: "overdueDays",
      label: "Overdue",
      sortable: true,
      render: (r) =>
        r.overdueDays > 0 ? (
          <span className="font-semibold text-red-600">{r.overdueDays}d</span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    { key: "agentName", label: "Agent", sortable: true },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (r) => <Badge label={r.status} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (r) => (
        <button
          onClick={() => setEditingCustomer(r)}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-blue-50 hover:text-primary"
          title="Edit customer"
        >
          <Pencil size={16} />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Customers & Loan Accounts"
        description="Customer records, loan details and overdue tracking"
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search name, ID, loan account, phone..."
          className="w-80"
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
        <Select
          name="agent"
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value)}
          options={[
            { value: "", label: "All Agents" },
            { value: "unassigned", label: "Unassigned" },
            ...agents.map((a) => ({ value: a.id, label: a.name })),
          ]}
        />
        <Select
          name="status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={STATUS_OPTIONS}
        />
      </div>

      <DataTable columns={columns} data={filtered} />

      <CustomerFormModal
        isOpen={Boolean(editingCustomer)}
        onClose={() => setEditingCustomer(null)}
        onSubmit={handleSaveCustomer}
        customer={editingCustomer}
      />
    </div>
  );
}
