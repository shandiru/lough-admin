import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { adminLinks, staffLinks } from "../config/roleLinks";
import { FiLogOut, FiChevronLeft, FiChevronRight } from "react-icons/fi";

const Sidebar = () => {
  const { name, role, handleLogout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const links = role === "admin" ? adminLinks : staffLinks;

  return (
    <aside
      className={`h-screen bg-[#cbb49c] text-[#22b8c7] flex flex-col transition-all duration-300 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Brand */}
      <div className="flex items-center justify-between p-4 border-b border-white/40">
        {!collapsed && (
          <img
            src="/logo.webp"
            alt="Lough Skin"
            className="h-12 w-auto"
          />
        )}
        <button onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? (
            <FiChevronRight size={20} />
          ) : (
            <FiChevronLeft size={20} />
          )}
        </button>
      </div>

      {/* User Info */}
      {!collapsed && (
        <div className="mx-3 my-6 p-3 bg-white/40 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#22b8c7] text-white rounded-full flex items-center justify-center font-semibold">
              {name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-[#1f8e9a]">{name}</p>
              <p className="text-xs text-[#1f8e9a]/70">
                {role?.toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;

          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${
                isActive
                  ? "bg-[#22b8c7] text-white shadow-md"
                  : "hover:bg-white/40"
              }`}
            >
              <Icon size={18} />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2 rounded-xl hover:bg-white/40 transition"
        >
          <FiLogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;