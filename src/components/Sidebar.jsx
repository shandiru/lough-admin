import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useDispatch } from "react-redux";
import { updateUserProfile } from "../store/slices/authSlice";
import { adminLinks, staffLinks } from "../config/roleLinks";
import { FiLogOut, FiChevronLeft, FiChevronRight, FiMenu, FiX } from "react-icons/fi";
import { profileService } from "../api/profileService";
import ProfileUpdateModal from "./Profile/ProfileUpdateModal";

const getImageUrl = (src) => {
  if (!src) return null;
  if (src.startsWith("http")) return src;
  return `${import.meta.env.VITE_API_URL?.replace("/api", "")}${src}`;
};

const Sidebar = () => {
  const { name, role, profileImage: reduxProfileImage, handleLogout } = useAuth();
  const dispatch = useDispatch();
  const location = useLocation();

  const [collapsed,         setCollapsed]         = useState(false);
  const [mobileOpen,        setMobileOpen]        = useState(false);
  const [showProfileModal,  setShowProfileModal]  = useState(false);
  const [profileData,       setProfileData]       = useState(null);

  const links = role === "admin" ? adminLinks : staffLinks;

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Prevent body scroll when mobile sidebar open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    profileService.getMyProfile()
      .then(({ data }) => setProfileData(data))
      .catch(() => {});
  }, []);

  const handleProfileUpdated = (updated) => {
    setProfileData({ user: updated.user, staff: updated.staff });
    dispatch(updateUserProfile({
      name: `${updated.user.firstName} ${updated.user.lastName}`,
      profileImage: updated.user.profileImage,
    }));
  };

  const rawProfileImage = profileData?.user?.profileImage || reduxProfileImage || null;
  const profileImage    = getImageUrl(rawProfileImage);
  const initials        = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const AvatarCircle = ({ size = "w-9 h-9", textSize = "text-sm" }) => (
    <button
      onClick={() => setShowProfileModal(true)}
      title="Edit profile"
      className={`${size} rounded-full overflow-hidden bg-[#22b8c7] flex items-center justify-center text-white font-bold ${textSize} shrink-0 hover:scale-110 transition-transform border-2 border-white shadow`}
    >
      {profileImage
        ? <img src={profileImage} alt="avatar" className="w-full h-full object-cover" />
        : <span>{initials}</span>
      }
    </button>
  );

  const SidebarContent = ({ isMobile = false }) => (
    <aside className={`
      h-full bg-[#cbb49c] text-[#3b1f0e] flex flex-col transition-all duration-300
      ${isMobile ? "w-64" : (collapsed ? "w-16" : "w-60")}
    `}>
      {/* Brand */}
      <div className="flex items-center justify-between p-4 border-b border-[#a08060]/40">
        {(isMobile || !collapsed) && (
          <img src="/logo.webp" alt="Lough Skin" className="h-12 w-auto" />
        )}
        {isMobile ? (
          <button onClick={() => setMobileOpen(false)} className="text-[#3b1f0e] hover:text-[#22b8c7] transition-colors ml-auto">
            <FiX size={22} />
          </button>
        ) : (
          <button onClick={() => setCollapsed(!collapsed)} className="text-[#3b1f0e] hover:text-[#22b8c7] transition-colors">
            {collapsed ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
          </button>
        )}
      </div>

      {/* User Info */}
      {(isMobile || !collapsed) && (
        <div className="mx-3 my-4 p-3 bg-white/40 rounded-xl">
          <div className="flex items-center gap-3">
            <AvatarCircle />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#3b1f0e] truncate">{name}</p>
              <p className="text-xs text-[#3b1f0e]/60">{role?.toUpperCase()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Avatar only (collapsed desktop) */}
      {!isMobile && collapsed && (
        <div className="flex justify-center py-4">
          <AvatarCircle size="w-9 h-9" />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon     = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                isActive
                  ? "bg-[#22b8c7] text-white shadow-md"
                  : "text-[#3b1f0e] hover:bg-white/50 hover:text-[#22b8c7]"
              }`}
            >
              <Icon size={18} className="shrink-0" />
              {(isMobile || !collapsed) && <span className="font-medium">{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-[#3b1f0e] hover:bg-white/50 hover:text-[#22b8c7] transition-colors"
        >
          <FiLogOut size={18} className="shrink-0" />
          {(isMobile || !collapsed) && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* ── Desktop Sidebar (sticky, always visible) ── */}
      <div className="hidden lg:flex h-screen sticky top-0 shrink-0">
        <SidebarContent isMobile={false} />
      </div>

      {/* ── Mobile: Hamburger Button (top-left, fixed) ── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-[#cbb49c] rounded-xl shadow-lg flex items-center justify-center text-[#3b1f0e] hover:bg-[#b8a088] transition-colors"
        aria-label="Open menu"
      >
        <FiMenu size={20} />
      </button>

      {/* ── Mobile: Backdrop ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile: Slide-in Drawer ── */}
      <div className={`
        lg:hidden fixed top-0 left-0 h-full z-50 transition-transform duration-300 ease-in-out
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <SidebarContent isMobile={true} />
      </div>

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
