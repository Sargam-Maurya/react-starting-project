import { useState, useMemo } from "react";
import { useData } from "../context/DataContext";
import { useDebounce } from "../hooks/useDebounce";
import PageHeader from "../components/ui/PageHeader";
import DataTable from "../components/ui/DataTable";
import SearchInput from "../components/ui/SearchInput";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import { formatDateTime } from "../utils/formatters";

const ACTION_COLORS = {
  "Collection Recorded": "green",
  "Agent Added": "blue",
  "Agent Updated": "blue",
  "Agent Assigned": "purple",
  "Customer Updated": "blue",
  "Deposit Submitted": "yellow",
  "Deposit Approved": "green",
  "Deposit Rejected": "red",
};

export default function AuditLogs() {
  const { auditLogs } = useData();
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const debouncedSearch = useDebounce(search);

  const actionOptions = useMemo(() => {
    const unique = [...new Set(auditLogs.map((l) => l.action))].sort();
    return [
      { value: "", label: "All Actions" },
      ...unique.map((a) => ({ value: a, label: a })),
    ];
  }, [auditLogs]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return [...auditLogs]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .filter(
        (l) =>
          (!q ||
            l.user.toLowerCase().includes(q) ||
            l.action.toLowerCase().includes(q) ||
            l.referenceId.toLowerCase().includes(q) ||
            l.details.toLowerCase().includes(q)) &&
          (!actionFilter || l.action === actionFilter)
      );
  }, [auditLogs, debouncedSearch, actionFilter]);

  const columns = [
    {
      key: "timestamp",
      label: "Timestamp",
      sortable: true,
      sortValue: (r) => new Date(r.timestamp).getTime(),
      render: (r) => formatDateTime(r.timestamp),
    },
    { key: "user", label: "User", sortable: true },
    {
      key: "action",
      label: "Action",
      sortable: true,
      render: (r) => (
        <Badge label={r.action} color={ACTION_COLORS[r.action] ?? "gray"} />
      ),
    },
    { key: "referenceId", label: "Reference ID", sortable: true },
    { key: "details", label: "Details" },
  ];

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="System-wide activity trail for collections, deposits and assignments"
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search user, action, reference, details..."
          className="w-80"
        />
        <Select
          name="action"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          options={actionOptions}
        />
      </div>

      <DataTable columns={columns} data={filtered} />
    </div>
  );
}
