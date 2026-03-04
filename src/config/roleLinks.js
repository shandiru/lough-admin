import {
  FiHome,
  FiGrid,
  FiLayers,
  FiUsers,
  FiUser,
  FiShoppingBag,
  FiCalendar,
} from 'react-icons/fi';

export const adminLinks = [
  { path: '/dashboard/admin',          label: 'Overview',  icon: FiHome },
  { path: '/dashboard/admin/category', label: 'Category',  icon: FiGrid },
  { path: '/dashboard/admin/service',  label: 'Service',   icon: FiLayers },
  { path: '/dashboard/admin/staff',    label: 'Staff',     icon: FiUsers },
  { path: '/dashboard/admin/leaves',   label: 'Leaves',    icon: FiCalendar }, // ← NEW
];

export const staffLinks = [
  { path: "/dashboard/staff", label: "Home", icon: FiHome },
 
  { path: '/dashboard/staff/leaves',   label: 'Leaves',  icon: FiCalendar }, 
];