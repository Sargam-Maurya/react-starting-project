import { useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { formatCurrency, formatDate } from "../../utils/formatters";

export default function DepositReviewModal({ isOpen, onClose, deposit, onApprove, onReject }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState(null); // null | "reject"

  if (!deposit) return null;

  function handleClose() {
    setReason("");
    setError("");
    setMode(null);
    onClose();
  }

  function handleReject() {
    if (!reason.trim()) {
      setError("Rejection reason is required");
      return;
    }
    onReject(deposit, reason.trim());
    handleClose();
  }

  const rows = [
    ["Deposit ID", deposit.id],
    ["Reference", deposit.referenceNumber],
    ["Agent", `${deposit.agentName} (${deposit.agentId})`],
    ["Branch", deposit.branch],
    ["Amount", formatCurrency(deposit.amount)],
    ["Deposit Date", formatDate(deposit.depositDate)],
    ["Submitted By", deposit.submittedBy],
    ["Status", <Badge key="s" label={deposit.status} />],
  ];

  if (deposit.status === "Rejected" && deposit.rejectionReason) {
    rows.push(["Rejection Reason", deposit.rejectionReason]);
  }
  if (deposit.status === "Approved" && deposit.verifiedBy) {
    rows.push(["Verified By", deposit.verifiedBy]);
  }

  const isPending = deposit.status === "Pending";

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Deposit Review — ${deposit.id}`}
      footer={
        isPending ? (
          mode === "reject" ? (
            <>
              <Button variant="outline" onClick={() => setMode(null)}>
                Back
              </Button>
              <Button variant="danger" onClick={handleReject}>
                Confirm Rejection
              </Button>
            </>
          ) : (
            <>
              <Button variant="danger" onClick={() => setMode("reject")}>
                Reject
              </Button>
              <Button onClick={() => { onApprove(deposit); handleClose(); }}>
                Approve Deposit
              </Button>
            </>
          )
        ) : (
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        )
      }
    >
      <dl className="divide-y divide-gray-100">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between py-2 text-sm">
            <dt className="text-gray-500">{label}</dt>
            <dd className="font-medium text-gray-900">{value}</dd>
          </div>
        ))}
      </dl>

      {isPending && mode === "reject" && (
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Rejection Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError("");
            }}
            rows={3}
            placeholder="e.g. Amount mismatch with collection records"
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${
              error ? "border-red-500" : "border-gray-300"
            }`}
          />
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
      )}
    </Modal>
  );
}
