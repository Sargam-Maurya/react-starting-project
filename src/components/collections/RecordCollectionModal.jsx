import { useState, useEffect } from "react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import { useData } from "../../context/DataContext";
import { PAYMENT_MODES } from "../../constants";

const EMPTY_FORM = {
  customerId: "",
  agentId: "",
  amount: "",
  paymentDate: "",
  mode: "",
  referenceNumber: "",
};

export default function RecordCollectionModal({ isOpen, onClose, onSubmit }) {
  const { customers, agents, collections } = useData();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const selectedCustomer = customers.find((c) => c.id === form.customerId);
  const assignedAgent = agents.find((a) => a.id === selectedCustomer?.agentId);
  const effectiveAgent = assignedAgent ?? agents.find((a) => a.id === form.agentId);

  useEffect(() => {
    if (isOpen) {
      setForm({
        ...EMPTY_FORM,
        paymentDate: new Date().toISOString().slice(0, 10),
        referenceNumber: `RCP${Math.floor(100000 + Math.random() * 900000)}`,
      });
      setErrors({});
    }
  }, [isOpen]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      // Auto-fill EMI amount when a customer is picked
      if (name === "customerId") {
        const customer = customers.find((c) => c.id === value);
        next.amount = customer ? customer.emiAmount : "";
        next.agentId = "";
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function validate() {
    const next = {};
    if (!form.customerId) next.customerId = "Select a customer";
    if (!assignedAgent && !form.agentId) next.agentId = "Select an agent";
    if (!form.amount || Number(form.amount) <= 0)
      next.amount = "Amount must be greater than 0";
    if (!form.paymentDate) next.paymentDate = "Payment date is required";
    else if (new Date(form.paymentDate) > new Date())
      next.paymentDate = "Date cannot be in the future";
    if (!form.mode) next.mode = "Select a payment mode";
    if (!form.referenceNumber.trim())
      next.referenceNumber = "Reference number is required";
    else if (
      collections.some(
        (c) =>
          c.referenceNumber.toLowerCase() === form.referenceNumber.trim().toLowerCase()
      )
    )
      next.referenceNumber = "Reference number already exists";
    return next;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSubmit({
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      loanAccountNumber: selectedCustomer.loanAccountNumber,
      agentId: effectiveAgent.id,
      agentName: effectiveAgent.name,
      branch: effectiveAgent.branch,
      amount: Number(form.amount),
      paymentDate: new Date(form.paymentDate).toISOString(),
      mode: form.mode,
      referenceNumber: form.referenceNumber.trim(),
      status: "Completed",
    });
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Collection"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="collection-form">
            Record Payment
          </Button>
        </>
      }
    >
      <form id="collection-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Select
          label="Customer"
          name="customerId"
          value={form.customerId}
          onChange={handleChange}
          options={customers.map((c) => ({
            value: c.id,
            label: `${c.name} · ${c.loanAccountNumber}`,
          }))}
          placeholder="Select customer"
          error={errors.customerId}
          required
        />

        {selectedCustomer && (
          <div className="rounded-lg bg-surface px-3 py-2 text-xs text-gray-600">
            Loan Account{" "}
            <span className="font-semibold text-gray-900">
              {selectedCustomer.loanAccountNumber}
            </span>
            {" · "}EMI{" "}
            <span className="font-semibold text-gray-900">
              ₹{selectedCustomer.emiAmount.toLocaleString("en-IN")}
            </span>
            {" · "}Outstanding{" "}
            <span className="font-semibold text-gray-900">
              ₹{selectedCustomer.outstandingAmount.toLocaleString("en-IN")}
            </span>
          </div>
        )}

        {assignedAgent ? (
          <div className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600">
            Agent:{" "}
            <span className="font-semibold text-gray-900">{assignedAgent.name}</span>
            <span className="text-gray-400"> ({assignedAgent.id} · {assignedAgent.branch})</span>
          </div>
        ) : (
          <Select
            label="Collecting Agent"
            name="agentId"
            value={form.agentId}
            onChange={handleChange}
            options={agents
              .filter((a) => a.status === "Active")
              .map((a) => ({ value: a.id, label: `${a.name} (${a.branch})` }))}
            placeholder="Select agent"
            error={errors.agentId}
            required
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Collection Amount (₹)"
            name="amount"
            type="number"
            value={form.amount}
            onChange={handleChange}
            placeholder="e.g. 12500"
            error={errors.amount}
            required
          />
          <Input
            label="Payment Date"
            name="paymentDate"
            type="date"
            value={form.paymentDate}
            onChange={handleChange}
            error={errors.paymentDate}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Payment Mode"
            name="mode"
            value={form.mode}
            onChange={handleChange}
            options={PAYMENT_MODES.map((m) => ({ value: m, label: m }))}
            placeholder="Select mode"
            error={errors.mode}
            required
          />
          <Input
            label="Reference Number"
            name="referenceNumber"
            value={form.referenceNumber}
            onChange={handleChange}
            placeholder="Receipt / UTR number"
            error={errors.referenceNumber}
            required
          />
        </div>
      </form>
    </Modal>
  );
}
