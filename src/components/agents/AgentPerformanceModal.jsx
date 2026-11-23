import Modal from "../ui/Modal";
import Badge from "../ui/Badge";
import { useData } from "../../context/DataContext";
import { formatCurrency, formatDate } from "../../utils/formatters";

export default function AgentPerformanceModal({ isOpen, onClose, agent }) {
  const { customers, collections } = useData();

  if (!agent) return null;

  const assignedCustomers = customers.filter((c) => c.agentId === agent.id);
  const agentCollections = collections
    .filter((c) => c.agentId === agent.id)
    .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

  const collected = agentCollections.reduce((acc, c) => acc + c.amount, 0);
  const progress = agent.monthlyTarget
    ? Math.min(100, Math.round((collected / agent.monthlyTarget) * 100))
    : 0;

  const stats = [
    { label: "Total Collected", value: formatCurrency(collected) },
    { label: "Monthly Target", value: formatCurrency(agent.monthlyTarget) },
    { label: "Assigned Customers", value: assignedCustomers.length },
    { label: "Collections Made", value: agentCollections.length },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Agent Performance — ${agent.name}`}>
      <div className="mb-4 flex items-center gap-3 text-sm text-gray-600">
        <span>{agent.branch}</span>
        <span>·</span>
        <span>{agent.phone}</span>
        <Badge label={agent.status} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg bg-surface p-3">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="mt-0.5 text-lg font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Target progress</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-5">
        <h4 className="mb-2 text-sm font-semibold text-gray-900">Recent Collections</h4>
        {agentCollections.length === 0 ? (
          <p className="text-sm text-gray-500">No collections recorded yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {agentCollections.slice(0, 5).map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium text-gray-900">{c.customerName}</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(c.paymentDate)} · {c.mode}
                  </p>
                </div>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(c.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
