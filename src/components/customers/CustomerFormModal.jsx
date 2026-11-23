import { useState, useEffect } from "react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import { useData } from "../../context/DataContext";

const EMPTY_FORM = {
  name: "",
  phone: "",
  emiAmount: "",
  dueDate: "",
  outstandingAmount: "",
  overdueDays: "0",
  agentId: "",
  status: "Active",
};

export default function CustomerFormModal({ isOpen, onClose, onSubmit, customer }) {
  const { agents } = useData();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && customer) {
      setForm({
        name: customer.name,
        phone: customer.phone,
        emiAmount: customer.emiAmount,
        dueDate: customer.dueDate,
        outstandingAmount: customer.outstandingAmount,
        overdueDays: String(customer.overdueDays),
        agentId: customer.agentId ?? "",
        status: customer.status,
      });
      setErrors({});
    }
  }, [isOpen, customer]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = "Customer name is required";
    if (!form.phone.trim()) next.phone = "Phone number is required";
    else if (!/^[+\d][\d\s-]{9,14}$/.test(form.phone.trim()))
      next.phone = "Enter a valid phone number";
    if (!form.emiAmount || Number(form.emiAmount) <= 0)
      next.emiAmount = "EMI must be greater than 0";
    if (!form.dueDate) next.dueDate = "Due date is required";
    if (form.outstandingAmount === "" || Number(form.outstandingAmount) < 0)
      next.outstandingAmount = "Outstanding cannot be negative";
    if (Number(form.overdueDays) < 0) next.overdueDays = "Cannot be negative";
    return next;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    const agent = agents.find((a) => a.id === form.agentId);
    onSubmit({
      ...form,
      emiAmount: Number(form.emiAmount),
      outstandingAmount: Number(form.outstandingAmount),
      overdueDays: Number(form.overdueDays),
      agentId: form.agentId || null,
      branch: agent?.branch ?? customer.branch,
      status: Number(form.overdueDays) > 0 ? "Overdue" : "Active",
    });
    onClose();
  }

  if (!customer) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Customer — ${customer.id}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="customer-form">
            Save Changes
          </Button>
        </>
      }
    >
      <form id="customer-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="rounded-lg bg-surface px-3 py-2 text-xs text-gray-500">
          Loan Account <span className="font-semibold text-gray-900">{customer.loanAccountNumber}</span>
          {" · "}Loan Amount{" "}
          <span className="font-semibold text-gray-900">
            ₹{customer.loanAmount.toLocaleString("en-IN")}
          </span>
        </div>
        <Input
          label="Customer Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
          required
        />
        <Input
          label="Phone"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          error={errors.phone}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="EMI Amount (₹)"
            name="emiAmount"
            type="number"
            value={form.emiAmount}
            onChange={handleChange}
            error={errors.emiAmount}
            required
          />
          <Input
            label="Outstanding (₹)"
            name="outstandingAmount"
            type="number"
            value={form.outstandingAmount}
            onChange={handleChange}
            error={errors.outstandingAmount}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Due Date"
            name="dueDate"
            type="date"
            value={form.dueDate}
            onChange={handleChange}
            error={errors.dueDate}
            required
          />
          <Input
            label="Overdue Days"
            name="overdueDays"
            type="number"
            value={form.overdueDays}
            onChange={handleChange}
            error={errors.overdueDays}
          />
        </div>
        <Select
          label="Assigned Agent"
          name="agentId"
          value={form.agentId}
          onChange={handleChange}
          options={agents.map((a) => ({
            value: a.id,
            label: `${a.name} (${a.branch})`,
          }))}
          placeholder="Unassigned"
        />
      </form>
    </Modal>
  );
}
