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
      <td className="px-5 py-5">
        <span className="block truncate text-sm font-black text-gray-800">{service.name}</span>
      </td>

      <td className="px-5 py-5">
        <span className="block truncate text-xs font-semibold text-gray-500">
          {service.category?.name || '-'}
        </span>
      </td>

      <td className="px-5 py-5">
        <span className="text-xs font-black text-gray-700">{service.duration} min</span>
      </td>

      <td className="px-5 py-5">
        <span className="text-sm font-black text-gray-800">€{service.price.toFixed(2)}</span>
      </td>

      <td className="px-5 py-5">
        <span className="text-xs font-semibold text-gray-500">
          {Math.round(service.depositPercentage * 100)}%
        </span>
      </td>

      <td className="px-5 py-5 text-center">
        <span className="rounded-full bg-brand/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-brand">
          {genderLabel[service.genderRestriction] || service.genderRestriction}
        </span>
      </td>

      <td className="px-5 py-5 text-center">
        <span
          className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
            service.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
          }`}
        >
          {service.isActive ? 'Active' : 'Hidden'}
        </span>
      </td>

      <td className="px-5 py-5 text-right">
        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
          <button
            onClick={() => onEdit(service)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand/10 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-brand transition-all duration-200 hover:bg-brand hover:text-white active:scale-95"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500 transition-all duration-200 hover:bg-[#B62025] hover:text-white active:scale-95"
            aria-label={`Delete ${service.name}`}
            title={`Delete ${service.name}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default ServiceRow;
