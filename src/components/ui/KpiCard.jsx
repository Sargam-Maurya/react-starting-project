export default function KpiCard({ title, value, subtitle, icon: Icon, trend }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
            <Icon size={22} />
          </div>
        )}
      </div>
      {trend && (
        <p
          className={`mt-3 text-xs font-medium ${
            trend.positive ? "text-green-600" : "text-red-600"
          }`}
        >
          {trend.value}
        </p>
      )}
    </div>
  );
}
