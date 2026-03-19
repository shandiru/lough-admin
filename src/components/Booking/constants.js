export const TEAL = '#22B8C8';
export const GOLD = '#C9AF94';

export const STAFF_COLORS = [
  '#22B8C8', '#C9AF94', '#a78bfa', '#f97316',
  '#10b981', '#ec4899', '#3b82f6', '#f59e0b',
];

export const STATUS_CLS = {
  pending:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-100   text-blue-700   border-blue-200',
  completed: 'bg-green-100  text-green-700  border-green-200',
  cancelled: 'bg-red-100    text-red-600    border-red-200',
  'no-show': 'bg-gray-100   text-gray-500   border-gray-200',
};

export const INPUT_CLS =
  'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#22B8C8] focus:ring-2 focus:ring-[#22B8C8]/10 bg-gray-50 transition-all';

export const INPUT_ERR_CLS =
  'w-full border border-red-400 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 bg-gray-50 transition-all';

export function toMins(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function fromMins(m) {
  return `${Math.floor(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`;
}

export function isoDate(d) {
  const date = d instanceof Date ? d : new Date(d);
  const year  = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day   = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function isValidUKPhone(v) {
  const s = v.replace(/[\s\-().]/g, '');
  return (
    /^07\d{9}$/.test(s) ||
    /^\+447\d{9}$/.test(s) ||
    /^0[1-3]\d{8,9}$/.test(s) ||
    /^\+44[1-3]\d{8,9}$/.test(s)
  );
}