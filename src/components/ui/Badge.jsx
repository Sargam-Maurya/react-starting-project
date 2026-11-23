const colorMap = {
  green: "bg-green-100 text-green-700",
  red: "bg-red-100 text-red-700",
  yellow: "bg-yellow-100 text-yellow-700",
  blue: "bg-blue-100 text-blue-700",
  gray: "bg-gray-100 text-gray-600",
  purple: "bg-purple-100 text-purple-700",
};

const statusColors = {
  Active: "green",
  Inactive: "gray",
  Pending: "yellow",
  Approved: "green",
  Rejected: "red",
  Paid: "green",
  Overdue: "red",
  Verified: "green",
  Cash: "yellow",
  UPI: "blue",
  "Bank Transfer": "purple",
};

export default function Badge({ label, color }) {
  const resolved = color || statusColors[label] || "gray";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorMap[resolved]}`}
    >
      {label}
    </span>
  );
}
