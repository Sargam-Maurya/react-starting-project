import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { useData } from "../context/DataContext";
import { useDebounce } from "../hooks/useDebounce";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import DataTable from "../components/ui/DataTable";
import SearchInput from "../components/ui/SearchInput";
import Select from "../components/ui/Select";
import RecordCollectionModal from "../components/collections/RecordCollectionModal";
import { formatCurrency, formatDate } from "../utils/formatters";
import { PAYMENT_MODES } from "../constants";

export default function Collections() {
  const { collections, branches, addRecord, updateRecord, logAudit, customers } =
    useData();

  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const debouncedSearch = useDebounce(search);

  const [modalOpen, setModalOpen] = useState(false);

  const rows = useMemo(
    () =>
      [...collections].sort(
        (a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)
      ),
    [collections]
  );

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return rows.filter(
      (r) =>
        (!q ||
          r.id.toLowerCase().includes(q) ||
          r.customerName.toLowerCase().includes(q) ||
          r.loanAccountNumber.toLowerCase().includes(q) ||
          r.referenceNumber.toLowerCase().includes(q) ||
          r.agentName.toLowerCase().includes(q)) &&
        (!modeFilter || r.mode === modeFilter) &&
        (!branchFilter || r.branch === branchFilter)
    );
  }, [rows, debouncedSearch, modeFilter, branchFilter]);

  function handleRecord(txn) {
    const maxNum = Math.max(
      0,
      ...collections.map((c) => parseInt(c.id.split("-")[1], 10))
    );
    const newTxn = {
      ...txn,
      id: `TXN-${String(maxNum + 1).padStart(5, "0")}`,
    };
    addRecord("collections", newTxn);

    // Reduce the customer's outstanding balance
    const customer = customers.find((c) => c.id === txn.customerId);
    if (customer) {
      const outstanding = Math.max(0, customer.outstandingAmount - txn.amount);
      const overdueDays = outstanding === 0 ? 0 : customer.overdueDays;
      updateRecord("customers", customer.id, {
        outstandingAmount: outstanding,
        overdueDays,
        status: overdueDays > 0 ? "Overdue" : "Active",
      });
    }

    logAudit(
      "Collection Recorded",
      newTxn.id,
      `${txn.mode} payment of ₹${txn.amount.toLocaleString("en-IN")} from ${txn.customerName}`
    );
  }

  const columns = [
    { key: "id", label: "Txn ID", sortable: true },
    {
      key: "paymentDate",
      label: "Date",
      sortable: true,
      sortValue: (r) => new Date(r.paymentDate).getTime(),
      render: (r) => formatDate(r.paymentDate),
    },
    { key: "customerName", label: "Customer", sortable: true },
    { key: "loanAccountNumber", label: "Loan Account", sortable: true },
    { key: "agentName", label: "Agent", sortable: true },
    { key: "branch", label: "Branch", sortable: true },
    {
      key: "mode",
      label: "Mode",
      sortable: true,
      render: (r) => <Badge label={r.mode} />,
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (r) => (
        <span className="font-semibold text-gray-900">{formatCurrency(r.amount)}</span>
      ),
    },
    { key: "referenceNumber", label: "Reference" },
  ];

  return (
    <div>
      <PageHeader
        title="Cash Collections"
        description="Recorded EMI collections across all payment modes"
      >
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Record Collection
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search txn, customer, agent, reference..."
          className="w-80"
        />
        <Select
          name="mode"
          value={modeFilter}
          onChange={(e) => setModeFilter(e.target.value)}
          options={[
            { value: "", label: "All Modes" },
            ...PAYMENT_MODES.map((m) => ({ value: m, label: m })),
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

      <DataTable columns={columns} data={filtered} />

      <RecordCollectionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleRecord}
      />
    </div>
  );
}
