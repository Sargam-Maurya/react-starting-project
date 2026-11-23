import { useState, useEffect } from "react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import { useData } from "../../context/DataContext";
import { AGENT_STATUS } from "../../constants";

const EMPTY_FORM = {
  name: "",
  phone: "",
  branch: "",
  monthlyTarget: "",
  status: AGENT_STATUS.ACTIVE,
};

export default function AgentFormModal({ isOpen, onClose, onSubmit, agent }) {
  const { branches } = useData();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm(
        agent
          ? {
              name: agent.name,
              phone: agent.phone,
              branch: agent.branch,
              monthlyTarget: agent.monthlyTarget,
              status: agent.status,
            }
          : EMPTY_FORM
      );
      setErrors({});
    }
  }, [isOpen, agent]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = "Agent name is required";
    if (!form.phone.trim()) next.phone = "Phone number is required";
    else if (!/^[+\d][\d\s-]{9,14}$/.test(form.phone.trim()))
      next.phone = "Enter a valid phone number";
    if (!form.branch) next.branch = "Branch is required";
    if (!form.monthlyTarget || Number(form.monthlyTarget) <= 0)
      next.monthlyTarget = "Target must be greater than 0";
    return next;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSubmit({ ...form, monthlyTarget: Number(form.monthlyTarget) });
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={agent ? "Edit Agent" : "Add Agent"}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="agent-form">
            {agent ? "Save Changes" : "Add Agent"}
          </Button>
        </>
      }
    >
      <form id="agent-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Full Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="e.g. Rahul Sharma"
          error={errors.name}
          required
        />
        <Input
          label="Phone"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="+91 98XXXXXXXX"
          error={errors.phone}
          required
        />
        <Select
          label="Branch"
          name="branch"
          value={form.branch}
          onChange={handleChange}
          options={branches.map((b) => ({ value: b, label: b }))}
          placeholder="Select branch"
          error={errors.branch}
          required
        />
        <Input
          label="Monthly Collection Target (₹)"
          name="monthlyTarget"
          type="number"
          value={form.monthlyTarget}
          onChange={handleChange}
          placeholder="e.g. 300000"
          error={errors.monthlyTarget}
          required
        />
        <Select
          label="Status"
          name="status"
          value={form.status}
          onChange={handleChange}
          options={Object.values(AGENT_STATUS).map((s) => ({ value: s, label: s }))}
          required
        />
      </form>
    </Modal>
  );
}
