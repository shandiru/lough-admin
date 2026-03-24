import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';

const genderLabel = {
  all: 'All',
  'female-only': 'Female',
  'male-only': 'Male',
};

const ServiceRow = ({ service, onEdit, onDelete }) => {

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'Delete Service?',
      text: `"${service.name}" will be permanently removed.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#B62025',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'No, keep it',
      reverseButtons: true,
      customClass: { popup: 'rounded-[28px] p-8' },
    });
    if (!result.isConfirmed) return;
    onDelete(service._id);
  };

  return (
    <tr className="hover:bg-brand/5 transition-colors">
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
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onEdit(service)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand/10 text-brand hover:bg-brand hover:text-white transition-all duration-200 text-xs font-black uppercase tracking-widest active:scale-95"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-500 hover:bg-[#B62025] hover:text-white transition-all duration-200 text-xs font-black uppercase tracking-widest active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
};

export default ServiceRow;