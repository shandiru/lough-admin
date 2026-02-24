import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';

const CategoryRow = ({ category, onEdit, onDelete }) => {
  return (
    <tr className="group hover:bg-brand/5 dark:hover:bg-brand/10 transition-all duration-200">
      {/* Order */}
      <td className="px-8 py-6 whitespace-nowrap">
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-brand-soft/40 dark:bg-gray-800 font-black text-brand text-sm">
          {category.displayOrder}
        </span>
      </td>

      {/* Name */}
      <td className="px-8 py-6 whitespace-nowrap">
        <span className="font-black text-gray-900 dark:text-white text-base tracking-tight group-hover:text-brand transition-colors duration-200">
          {category.name}
        </span>
      </td>

      {/* Description */}
      <td className="px-8 py-6 max-w-[240px]">
        <span className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed line-clamp-2">
          {category.description || (
            <span className="italic text-gray-300 dark:text-gray-600">No description</span>
          )}
        </span>
      </td>

      {/* Status */}
      <td className="px-8 py-6 text-center whitespace-nowrap">
        <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[2px] ${
          category.isActive
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${category.isActive ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`}></span>
          {category.isActive ? 'Active' : 'Hidden'}
        </span>
      </td>

      {/* Actions */}
      <td className="px-8 py-6 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onEdit(category)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand/10 text-brand hover:bg-brand hover:text-white dark:bg-brand/20 dark:hover:bg-brand dark:hover:text-white transition-all duration-200 text-xs font-black uppercase tracking-widest active:scale-95"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            onClick={() => onDelete(category._id)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-500 hover:bg-[#B62025] hover:text-white dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-[#B62025] dark:hover:text-white transition-all duration-200 text-xs font-black uppercase tracking-widest active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
};

export default CategoryRow;