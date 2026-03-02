import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';

const genderLabel = {
  all: 'All',
  'female-only': 'Female',
  'male-only': 'Male',
};

const ServiceRow = ({ service, onEdit, onDelete }) => {
  return (
    <tr className="hover:bg-brand/5 transition-colors group">
      {/* Name */}
      <td className="px-8 py-5">
        <span className="font-black text-gray-800 text-sm">{service.name}</span>
      </td>

      {/* Category */}
      <td className="px-8 py-5">
        <span className="text-xs font-semibold text-gray-500">
          {service.category?.name || '—'}
        </span>
      </td>

      {/* Duration */}
      <td className="px-8 py-5">
        <span className="text-xs font-black text-gray-700">{service.duration} min</span>
      </td>

      {/* Price */}
      <td className="px-8 py-5">
        <span className="text-sm font-black text-gray-800">€{service.price.toFixed(2)}</span>
      </td>

      {/* Deposit */}
      <td className="px-8 py-5">
        <span className="text-xs font-semibold text-gray-500">
          {Math.round(service.depositPercentage * 100)}%
        </span>
      </td>

      {/* Gender */}
      <td className="px-8 py-5 text-center">
        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-brand/10 text-brand">
          {genderLabel[service.genderRestriction] || service.genderRestriction}
        </span>
      </td>

      {/* Status */}
      <td className="px-8 py-5 text-center">
        <span
          className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
            service.isActive
              ? 'bg-emerald-100 text-emerald-600'
              : 'bg-gray-100 text-gray-400'
          }`}
        >
          {service.isActive ? 'Active' : 'Hidden'}
        </span>
      </td>

      {/* Actions */}
      <td className="px-8 py-5 text-right">
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(service)}
            className="p-2 rounded-xl bg-brand/10 hover:bg-brand/20 text-brand transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(service._id)}
            className="p-2 rounded-xl bg-[#B62025]/10 hover:bg-[#B62025]/20 text-[#B62025] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default ServiceRow;