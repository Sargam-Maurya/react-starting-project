import { useState, useEffect, useMemo } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import SearchInput from "../ui/SearchInput";
import { useData } from "../../context/DataContext";
import { useDebounce } from "../../hooks/useDebounce";
import { formatCurrency } from "../../utils/formatters";

export default function AssignCustomersModal({ isOpen, onClose, onSave, agent }) {
  const { customers } = useData();
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    if (isOpen && agent) {
      setSelected(
        new Set(customers.filter((c) => c.agentId === agent.id).map((c) => c.id))
      );
      setSearch("");
    }
  }, [isOpen, agent, customers]);

  const visibleCustomers = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return customers.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.loanAccountNumber.toLowerCase().includes(q)
    );
  }, [customers, debouncedSearch]);

  function toggle(customerId) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(customerId) ? next.delete(customerId) : next.add(customerId);
      return next;
    });
  }

  function handleSave() {
    onSave(agent, selected);
    onClose();
  }

  if (!agent) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Customers — ${agent.name}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Assignments ({selected.size})</Button>
        </>
      }
    >
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search by name, ID or loan account..."
        className="mb-3"
      />
      <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-200">
        {visibleCustomers.map((c) => {
          const isChecked = selected.has(c.id);
          const otherAgent = c.agentId !== agent.id;
          return (
            <label
              key={c.id}
              className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-3 py-2.5 last:border-0 hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggle(c.id)}
                className="h-4 w-4 accent-primary"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {c.name}
                  <span className="ml-2 text-xs font-normal text-gray-400">{c.id}</span>
                </p>
                <p className="text-xs text-gray-500">
                  {c.loanAccountNumber} · Outstanding {formatCurrency(c.outstandingAmount)}
                </p>
              </div>
              {otherAgent && isChecked && (
                <span className="text-xs text-amber-600">reassign</span>
              )}
            </label>
          );
        })}
        {visibleCustomers.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-gray-500">
            No customers match your search.
          </p>
        )}
      </div>
    </Modal>
  );
}
