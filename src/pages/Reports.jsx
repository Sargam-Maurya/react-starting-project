import { useState, useMemo } from "react";
import { Download } from "lucide-react";
import { useData } from "../context/DataContext";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import DataTable from "../components/ui/DataTable";
import Select from "../components/ui/Select";
import Input from "../components/ui/Input";
import { exportToCsv } from "../utils/csv";
import { formatCurrency, formatDate } from "../utils/formatters";

const REPORT_TYPES = [
  { value: "daily", label: "Daily Collection Report" },
  { value: "agent", label: "Agent Performance Report" },
  { value: "branch", label: "Branch-wise Collection Report" },
  { value: "deposits", label: "Cash Deposit Report" },
  { value: "pending", label: "Pending Reconciliation Report" },
];

export default function Reports() {
  const { agents, customers, collections, deposits, branches } = useData();

  const [reportType, setReportType] = useState("daily");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [branchFilter, setBranchFilter] = useState("");

  const inRange = (isoDate) => {
    const d = isoDate.slice(0, 10);
    if (fromDate && d < fromDate) return false;
    if (toDate && d > toDate) return false;
    return true;
  };

  const inBranch = (branch) => !branchFilter || branch === branchFilter;

  const scopedCollections = useMemo(
    () => collections.filter((c) => inBranch(c.branch) && inRange(c.paymentDate)),
    [collections, fromDate, toDate, branchFilter]
  );

  const scopedDeposits = useMemo(
    () => deposits.filter((d) => inBranch(d.branch) && inRange(d.depositDate)),
    [deposits, fromDate, toDate, branchFilter]
  );

  const report = useMemo(() => {
    switch (reportType) {
      case "daily": {
        const buckets = {};
        for (const c of scopedCollections) {
          const day = c.paymentDate.slice(0, 10);
          buckets[day] = buckets[day] || { date: day, count: 0, cash: 0, upi: 0, bank: 0, total: 0 };
          const b = buckets[day];
          b.count += 1;
          b.total += c.amount;
          if (c.mode === "Cash") b.cash += c.amount;
          else if (c.mode === "UPI") b.upi += c.amount;
          else b.bank += c.amount;
        }
        return {
          columns: [
            { key: "date", label: "Date", sortable: true, render: (r) => formatDate(r.date), value: (r) => r.date },
            { key: "count", label: "Collections", sortable: true },
            { key: "cash", label: "Cash", sortable: true, render: (r) => formatCurrency(r.cash), value: (r) => r.cash },
            { key: "upi", label: "UPI", sortable: true, render: (r) => formatCurrency(r.upi), value: (r) => r.upi },
            { key: "bank", label: "Bank Transfer", sortable: true, render: (r) => formatCurrency(r.bank), value: (r) => r.bank },
            { key: "total", label: "Total", sortable: true, render: (r) => formatCurrency(r.total), value: (r) => r.total },
          ],
          rows: Object.values(buckets).sort((a, b) => b.date.localeCompare(a.date)),
          filename: "daily-collection-report.csv",
        };
      }

      case "agent": {
        const rows = agents
          .filter((a) => inBranch(a.branch))
          .map((a) => {
            const txns = scopedCollections.filter((c) => c.agentId === a.id);
            const collected = txns.reduce((s, c) => s + c.amount, 0);
            const customerCount = customers.filter((c) => c.agentId === a.id).length;
            return {
              id: a.id,
              name: a.name,
              branch: a.branch,
              customerCount,
              txnCount: txns.length,
              collected,
              target: a.monthlyTarget,
              achievement: a.monthlyTarget ? Math.round((collected / a.monthlyTarget) * 100) : 0,
            };
          });
        return {
          columns: [
            { key: "id", label: "Agent ID", sortable: true },
            { key: "name", label: "Name", sortable: true },
            { key: "branch", label: "Branch", sortable: true },
            { key: "customerCount", label: "Customers", sortable: true },
            { key: "txnCount", label: "Collections", sortable: true },
            { key: "collected", label: "Collected", sortable: true, render: (r) => formatCurrency(r.collected), value: (r) => r.collected },
            { key: "target", label: "Target", sortable: true, render: (r) => formatCurrency(r.target), value: (r) => r.target },
            {
              key: "achievement",
              label: "Achievement",
              sortable: true,
              render: (r) => (
                <span className={r.achievement >= 100 ? "font-semibold text-green-600" : "text-gray-700"}>
                  {r.achievement}%
                </span>
              ),
              value: (r) => `${r.achievement}%`,
            },
          ],
          rows,
          filename: "agent-performance-report.csv",
        };
      }

      case "branch": {
        const rows = branches.map((b) => {
          const branchCollections = scopedCollections.filter((c) => c.branch === b);
          const cash = branchCollections.filter((c) => c.mode === "Cash").reduce((s, c) => s + c.amount, 0);
          const verified = scopedDeposits.filter((d) => d.branch === b && d.status === "Approved").reduce((s, d) => s + d.amount, 0);
          return {
            id: b,
            branch: b,
            agentCount: agents.filter((a) => a.branch === b).length,
            customerCount: customers.filter((c) => c.branch === b).length,
            txnCount: branchCollections.length,
            total: branchCollections.reduce((s, c) => s + c.amount, 0),
            cash,
            cashInHand: cash - verified,
          };
        });
        return {
          columns: [
            { key: "branch", label: "Branch", sortable: true },
            { key: "agentCount", label: "Agents", sortable: true },
            { key: "customerCount", label: "Customers", sortable: true },
            { key: "txnCount", label: "Collections", sortable: true },
            { key: "total", label: "Total Collected", sortable: true, render: (r) => formatCurrency(r.total), value: (r) => r.total },
            { key: "cash", label: "Cash Collected", sortable: true, render: (r) => formatCurrency(r.cash), value: (r) => r.cash },
            { key: "cashInHand", label: "Cash in Hand", sortable: true, render: (r) => formatCurrency(r.cashInHand), value: (r) => r.cashInHand },
          ],
          rows,
          filename: "branch-collection-report.csv",
        };
      }

      case "deposits": {
        return {
          columns: [
            { key: "id", label: "Deposit ID", sortable: true },
            { key: "referenceNumber", label: "Reference" },
            { key: "agentName", label: "Agent", sortable: true },
            { key: "branch", label: "Branch", sortable: true },
            { key: "amount", label: "Amount", sortable: true, render: (r) => formatCurrency(r.amount), value: (r) => r.amount },
            { key: "depositDate", label: "Date", sortable: true, render: (r) => formatDate(r.depositDate), value: (r) => r.depositDate.slice(0, 10) },
            { key: "status", label: "Status", sortable: true },
            { key: "submittedBy", label: "Submitted By" },
            { key: "verifiedBy", label: "Verified By", render: (r) => r.verifiedBy ?? "—", value: (r) => r.verifiedBy ?? "" },
          ],
          rows: [...scopedDeposits].sort((a, b) => new Date(b.depositDate) - new Date(a.depositDate)),
          filename: "cash-deposit-report.csv",
        };
      }

      case "pending": {
        const rows = agents
          .map((a) => {
            const cashCollected = collections
              .filter((c) => c.agentId === a.id && c.mode === "Cash")
              .reduce((s, c) => s + c.amount, 0);
            const verified = deposits
              .filter((d) => d.agentId === a.id && d.status === "Approved")
              .reduce((s, d) => s + d.amount, 0);
            const pending = deposits
              .filter((d) => d.agentId === a.id && d.status === "Pending")
              .reduce((s, d) => s + d.amount, 0);
            return {
              id: a.id,
              agent: a.name,
              branch: a.branch,
              cashCollected,
              verified,
              pending,
              cashInHand: cashCollected - verified,
            };
          })
          .filter((r) => inBranch(r.branch) && (r.pending > 0 || r.cashInHand > 0));
        return {
          columns: [
            { key: "agent", label: "Agent", sortable: true },
            { key: "branch", label: "Branch", sortable: true },
            { key: "cashCollected", label: "Cash Collected", sortable: true, render: (r) => formatCurrency(r.cashCollected), value: (r) => r.cashCollected },
            { key: "verified", label: "Verified Deposits", sortable: true, render: (r) => formatCurrency(r.verified), value: (r) => r.verified },
            { key: "pending", label: "Pending Verification", sortable: true, render: (r) => formatCurrency(r.pending), value: (r) => r.pending },
            {
              key: "cashInHand",
              label: "Cash in Hand",
              sortable: true,
              render: (r) => <span className="font-semibold text-amber-600">{formatCurrency(r.cashInHand)}</span>,
              value: (r) => r.cashInHand,
            },
          ],
          rows,
          filename: "pending-reconciliation-report.csv",
        };
      }

      default:
        return { columns: [], rows: [], filename: "report.csv" };
    }
  }, [reportType, scopedCollections, scopedDeposits, agents, customers, branches, branchFilter]);

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Operational reports with filtering and CSV export"
      >
        <Button onClick={() => exportToCsv(report.filename, report.columns, report.rows)}>
          <Download size={16} /> Export CSV
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Select
          label="Report Type"
          name="reportType"
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          options={REPORT_TYPES}
        />
        <Input
          label="From Date"
          name="fromDate"
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />
        <Input
          label="To Date"
          name="toDate"
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />
        <Select
          label="Branch"
          name="branch"
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          options={[
            { value: "", label: "All Branches" },
            ...branches.map((b) => ({ value: b, label: b })),
          ]}
        />
      </div>

      <DataTable columns={report.columns} data={report.rows} />
      <p className="mt-2 text-xs text-gray-400">
        {report.rows.length} rows · {REPORT_TYPES.find((r) => r.value === reportType)?.label}
      </p>
    </div>
  );
}
