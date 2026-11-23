import { useState, useRef, useEffect } from "react";
import { PanelLeft, Menu, LogOut, ChevronDown, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

export default function Topbar({ onToggleSidebar, onOpenMobileMenu }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const menuRef = useRef(null);

  const initials = user?.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-gray-200 bg-white px-4 lg:px-6">
      <button
        onClick={onOpenMobileMenu}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>
      <button
        onClick={onToggleSidebar}
        className="hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:block"
        aria-label="Toggle sidebar"
      >
        <PanelLeft size={20} />
      </button>

      <div className="flex-1" />

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100"
          aria-expanded={menuOpen}
          aria-haspopup="true"
        >
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
            {initials}
          </div>
          <ChevronDown
            size={14}
            className={`text-gray-400 transition-transform ${menuOpen ? "rotate-180" : ""}`}
          />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
              <p className="truncate text-xs text-gray-500">{user?.email}</p>
            </div>
            <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600">
              <User size={16} className="text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{user?.role}</p>
                <p className="text-xs text-gray-400">{user?.branch}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setMenuOpen(false);
                setConfirmOpen(true);
              }}
              className="flex w-full items-center gap-3 border-t border-gray-100 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm Logout"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={logout}>
              Log out
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to log out? Any unsaved changes will remain in
          demo storage, but your session will end.
        </p>
      </Modal>
    </header>
  );
}
