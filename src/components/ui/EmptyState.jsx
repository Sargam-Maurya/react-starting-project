import { Inbox } from "lucide-react";

export default function EmptyState({ title = "No records found", message = "Try adjusting your search or filters." }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-gray-100 p-4 text-gray-400">
        <Inbox size={28} />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{message}</p>
    </div>
  );
}
