import { useState, useEffect, useMemo } from "react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import { useData } from "../../context/DataContext";
import { formatCurrency } from "../../utils/formatters";

const EMPTY_FORM = {
  agentId: "",
  amount: "",
  depositDate: "",
  referenceNumber: "",
};

export default function DepositFormModal({ isOpen, onClose, onSubmit, cashPositions }) {
  const { deposits } = useData();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const position = cashPositions.find((p) => p.agent.id === form.agentId);

  const agentOptions = useMemo(
    () =>
      cashPositions.map((p) => ({
        value: p.agent.id,
        label: `${p.agent.name} — available ${formatCurrency(p.availableCash)}`,
        disabled: p.availableCash <= 0,
      })),
    [cashPositions]
  );

  useEffect(() => {
    if (isOpen) {
      setForm({
        ...EMPTY_FORM,
        depositDate: new Date().toISOString().slice(0, 10),
        referenceNumber: `UTR${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      });
      setErrors({});
    }
  }, [isOpen]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function validate() {
    const next = {};
    if (!form.agentId) next.agentId = "Select an agent";
    if (!form.amount || Number(form.amount) <= 0)
      next.amount = "Amount must be greater than 0";
    else if (position && Number(form.amount) > position.availableCash)
      next.amount = `Cannot exceed available cash (${formatCurrency(position.availableCash)})`;
    if (!form.depositDate) next.depositDate = "Deposit date is required";
    else if (new Date(form.depositDate) > new Date())
      next.depositDate = "Date cannot be in the future";
    if (!form.referenceNumber.trim())
      next.referenceNumber = "Reference number is required";
    else if (
      deposits.some(
        (d) =>
          d.referenceNumber.toLowerCase() ===
          form.referenceNumber.trim().toLowerCase()
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
      referenceNumber: form.referenceNumber.trim(),
      agentId: position.agent.id,
      agentName: position.agent.name,
      branch: position.agent.branch,
      amount: Number(form.amount),
      depositDate: new Date(form.depositDate).toISOString(),
    });
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Bank Deposit"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="deposit-form">
            Submit Deposit
          </Button>
        </>
      }
    >
      <form id="deposit-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Select
          label="Agent"
          name="agentId"
          value={form.agentId}
          onChange={handleChange}
          options={agentOptions}
          placeholder="Select agent"
          error={errors.agentId}
          required
        />

        {position && (
          <div className="grid grid-cols-3 gap-2 rounded-lg bg-surface p-3 text-center">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-500">Collected</p>
              <p className="text-sm font-bold text-gray-900">
                {formatCurrency(position.cashCollected)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-500">Deposited</p>
              <p className="text-sm font-bold text-gray-900">
                {formatCurrency(position.verifiedDeposits)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-500">Available</p>
              <p className="text-sm font-bold text-primary">
                {formatCurrency(position.availableCash)}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Deposit Amount (₹)"
            name="amount"
            type="number"
            value={form.amount}
            onChange={handleChange}
            placeholder="e.g. 50000"
            error={errors.amount}
            required
          />
          <Input
            label="Deposit Date"
            name="depositDate"
            type="date"
            value={form.depositDate}
            onChange={handleChange}
            error={errors.depositDate}
            required
          />
        </div>

        <Input
          label="Deposit Reference Number"
          name="referenceNumber"
          value={form.referenceNumber}
          onChange={handleChange}
          placeholder="UTR / slip number"
          error={errors.referenceNumber}
          required
        />
        <p className="text-xs text-gray-400">
          Deposit will be submitted as Pending until a supervisor verifies it.
        </p>
      </form>
    </Modal>
  );
}
