import { useState, useMemo } from "react";
import { Plus, Eye, Pencil, UserPlus } from "lucide-react";
import { useData } from "../context/DataContext";
import { useDebounce } from "../hooks/useDebounce";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import DataTable from "../components/ui/DataTable";
import SearchInput from "../components/ui/SearchInput";
import Select from "../components/ui/Select";
import AgentFormModal from "../components/agents/AgentFormModal";
import AgentPerformanceModal from "../components/agents/AgentPerformanceModal";
import AssignCustomersModal from "../components/agents/AssignCustomersModal";
import { formatCurrency } from "../utils/formatters";
import { AGENT_STATUS } from "../constants";

export default function Agents() {
  const { agents, customers, collections, branches, addRecord, updateRecord, logAudit } =
    useData();

  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const debouncedSearch = useDebounce(search);

  const [formOpen, setFormOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [viewingAgent, setViewingAgent] = useState(null);
  const [assigningAgent, setAssigningAgent] = useState(null);

  const rows = useMemo(() => {
    return agents.map((a) => {
      const assignedCustomers = customers.filter((c) => c.agentId === a.id);
      const agentCollections = collections.filter((c) => c.agentId === a.id);
      return {
        ...a,
        assignedCount: assignedCustomers.length,
        collected: agentCollections.reduce((acc, c) => acc + c.amount, 0),
        completedVisits: agentCollections.length,
        pendingVisits: assignedCustomers.filter((c) => c.overdueDays > 0).length,
      };
    });
  }, [agents, customers, collections]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return rows.filter(
      (r) =>
        (!q ||
          r.name.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.phone.toLowerCase().includes(q)) &&
        (!branchFilter || r.branch === branchFilter) &&
        (!statusFilter || r.status === statusFilter)
    );
  }, [rows, debouncedSearch, branchFilter, statusFilter]);

  function handleSaveAgent(form) {
    if (editingAgent) {
      updateRecord("agents", editingAgent.id, form);
      logAudit("Agent Updated", editingAgent.id, `Updated details for ${form.name}`);
    } else {
      const maxNum = Math.max(0, ...agents.map((a) => parseInt(a.id.split("-")[1], 10)));
      const newAgent = {
        ...form,
        id: `AGT-${String(maxNum + 1).padStart(3, "0")}`,
        joinedDate: new Date().toISOString().slice(0, 10),
      };
      addRecord("agents", newAgent);
      logAudit("Agent Added", newAgent.id, `Added agent ${form.name} (${form.branch})`);
    }
    setEditingAgent(null);
  }

  function handleSaveAssignments(agent, selectedIds) {
    let reassigned = 0;
    for (const c of customers) {
      const shouldBeAssigned = selectedIds.has(c.id);
      const isAssigned = c.agentId === agent.id;
      if (shouldBeAssigned && !isAssigned) {
        updateRecord("customers", c.id, { agentId: agent.id, branch: agent.branch });
        reassigned++;
      } else if (!shouldBeAssigned && isAssigned) {
        updateRecord("customers", c.id, { agentId: null });
        reassigned++;
      }
    }
    if (reassigned > 0) {
      logAudit(
        "Agent Assigned",
        agent.id,
        `${reassigned} customer assignment(s) updated for ${agent.name}`
      );
    }
  }

  const columns = [
    { key: "id", label: "Agent ID", sortable: true },
    { key: "name", label: "Name", sortable: true },
    { key: "branch", label: "Branch", sortable: true },
    { key: "assignedCount", label: "Customers", sortable: true },
    {
      key: "monthlyTarget",
      label: "Target",
      sortable: true,
      render: (r) => formatCurrency(r.monthlyTarget),
    },
    {
      key: "collected",
      label: "Collected",
      sortable: true,
      render: (r) => formatCurrency(r.collected),
    },
    { key: "pendingVisits", label: "Pending Visits", sortable: true },
    { key: "completedVisits", label: "Completed", sortable: true },
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
        <div className="flex gap-1">
          <button
            onClick={() => setViewingAgent(r)}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-blue-50 hover:text-primary"
            title="View performance"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => {
              setEditingAgent(r);
              setFormOpen(true);
            }}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-blue-50 hover:text-primary"
            title="Edit agent"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => setAssigningAgent(r)}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-blue-50 hover:text-primary"
            title="Assign customers"
          >
            <UserPlus size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Collection Agents"
        description="Manage agents, targets and customer assignments"
      >
        <Button onClick={() => setFormOpen(true)}>
          <Plus size={16} /> Add Agent
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name, ID or phone..."
          className="w-72"
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
          name="status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: "", label: "All Statuses" },
            ...Object.values(AGENT_STATUS).map((s) => ({ value: s, label: s })),
          ]}
        />
      </div>

      <DataTable columns={columns} data={filtered} />

      <AgentFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingAgent(null);
        }}
        onSubmit={handleSaveAgent}
        agent={editingAgent}
      />
      <AgentPerformanceModal
        isOpen={Boolean(viewingAgent)}
        onClose={() => setViewingAgent(null)}
        agent={viewingAgent}
      />
      <AssignCustomersModal
        isOpen={Boolean(assigningAgent)}
        onClose={() => setAssigningAgent(null)}
        onSave={handleSaveAssignments}
        agent={assigningAgent}
      />
    </div>
  );
}
