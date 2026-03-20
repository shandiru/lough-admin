import {
  FiHome,
  FiGrid,
  FiLayers,
  FiUsers,
  FiUser,
  FiShoppingBag,
  FiCalendar,
  FiShield,
} from 'react-icons/fi';

export const adminLinks = [
  { path: '/dashboard/admin',             label: 'Overview',   icon: FiHome },
  { path: '/dashboard/admin/category',    label: 'Category',   icon: FiGrid },
  { path: '/dashboard/admin/service',     label: 'Service',    icon: FiLayers },
  { path: '/dashboard/admin/staff',       label: 'Staff',      icon: FiUsers },
  { path: '/dashboard/admin/leaves',      label: 'Leaves',     icon: FiCalendar },
  { path: '/dashboard/admin/bookings',    label: 'Bookings',   icon: FiShoppingBag },
  { path: '/dashboard/admin/audit-logs',  label: 'Audit Logs', icon: FiShield },
];

export const staffLinks = [
  { path: "/dashboard/staff",           label: "Home",     icon: FiHome },
  { path: '/dashboard/staff/bookings',  label: 'Bookings', icon: FiShoppingBag },
  { path: '/dashboard/staff/leaves',    label: 'Leaves',   icon: FiCalendar },
];