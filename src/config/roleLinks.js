// src/config/roleLinks.js

import {
  FiHome,
  FiUsers,
  FiUserPlus,
  FiSettings,
  FiUser,
  FiShoppingBag,
} from "react-icons/fi";

export const adminLinks = [
  { path: "/dashboard/admin", label: "Overview", icon: FiHome },
  { path: "/dashboard/admin/users", label: "Cat", icon: FiUsers },
  { path: "/dashboard/admin/invite", label: "Invite User", icon: FiUserPlus },
  { path: "/dashboard/admin/settings", label: "Settings", icon: FiSettings },
];

export const staffLinks = [
  { path: "/dashboard/staff", label: "Home", icon: FiHome },
  { path: "/dashboard/staff/profile", label: "Profile", icon: FiUser },
  { path: "/dashboard/staff/orders", label: "Orders", icon: FiShoppingBag },
];