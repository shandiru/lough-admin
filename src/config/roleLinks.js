// src/config/roleLinks.js
import {
  FiHome,
  FiGrid,        // For Category
  FiLayers,      // For Service
  FiUsers,       // For Staff
  FiUser,
  FiShoppingBag,
} from "react-icons/fi";

export const adminLinks = [
  { path: "/dashboard/admin", label: "Overview", icon: FiHome },
  { path: "/dashboard/admin/category", label: "Category", icon: FiGrid },
  { path: "/dashboard/admin/service", label: "Service", icon: FiLayers },
  { path: "/dashboard/admin/staff", label: "Staff", icon: FiUsers },
];

export const staffLinks = [
  { path: "/dashboard/staff", label: "Home", icon: FiHome },

];