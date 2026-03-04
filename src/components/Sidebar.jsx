import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useDispatch } from "react-redux";
import { updateUserProfile } from "../store/slices/authSlice";
import { adminLinks, staffLinks } from "../config/roleLinks";
import { FiLogOut, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { profileService } from "../api/profileService";
import ProfileUpdateModal from "./Profile/ProfileUpdateModal";
import { Toaster } from "react-hot-toast";

// Build full image URL from stored path "/uploads/profiles/xxx.jpg"
const getImageUrl = (src) => {
  if (!src) return null;
  if (src.startsWith("http")) return src;
  return `${import.meta.env.VITE_API_URL?.replace("/api", "")}${src}`;
};

const Sidebar = () => {
  const { name, role, handleLogout } = useAuth();
  const dispatch = useDispatch();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState(null);

  const links = role === "admin" ? adminLinks : staffLinks;

  // Fetch profile on mount
  useEffect(() => {
    profileService
      .getMyProfile()
      .then(({ data }) => setProfileData(data))
      .catch(() => {});
  }, []);

  // After update: refresh local state + Redux
  const handleProfileUpdated = (updated) => {
    setProfileData({ user: updated.user, staff: updated.staff });
    dispatch(
      updateUserProfile({
        name: `${updated.user.firstName} ${updated.user.lastName}`,
        profileImage: updated.user.profileImage,
      })
    );
  };

  const profileImage = getImageUrl(profileData?.user?.profileImage);
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const AvatarCircle = ({ size = "w-9 h-9", textSize = "text-sm" }) => (
    <button
      onClick={() => setShowProfileModal(true)}
      title="Edit profile"
      className={`${size} rounded-full overflow-hidden bg-[#22b8c7] flex items-center justify-center text-white font-bold ${textSize} shrink-0 hover:scale-110 transition-transform border-2 border-white shadow`}
    >
      {profileImage ? (
        <img src={profileImage} alt="avatar" className="w-full h-full object-cover" />
      ) : (
        <span>{initials?.[0]}</span>
      )}
    </button>
  );

  return (
    <>
      <Toaster position="top-center" />

      <aside
        className={`h-screen bg-[#cbb49c] text-[#22b8c7] flex flex-col transition-all duration-300 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between p-4 border-b border-white/40">
          {!collapsed && (
            <img src="/logo.webp" alt="Lough Skin" className="h-12 w-auto" />
          )}
          <button onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
          </button>
        </div>

        {/* ── User Info (expanded) ── */}
        {!collapsed && (
          <div className="mx-3 my-6 p-3 bg-white/40 rounded-xl">
            <div className="flex items-center gap-3">
              <AvatarCircle />
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#1f8e9a] truncate">{name}</p>
                <p className="text-xs text-[#1f8e9a]/70">{role?.toUpperCase()}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Avatar only (collapsed) ── */}
        {collapsed && (
          <div className="flex justify-center py-4">
            <AvatarCircle size="w-9 h-9" />
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
                  isActive ? "bg-[#22b8c7] text-white shadow-md" : "hover:bg-white/40"
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

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileUpdateModal
          currentUser={profileData?.user}
          staffData={profileData?.staff}
          onClose={() => setShowProfileModal(false)}
          onUpdated={handleProfileUpdated}
        />
      )}
    </>
  );
};

export default Sidebar;