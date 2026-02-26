import { Loader2, LayoutGrid } from 'lucide-react';
import CategoryRow from './CategoryRow';

const CategoryTable = ({ categories, loading, onEdit, onDelete }) => {
  return (
    <div className="bg-white/70 backdrop-blur-md rounded-[32px] shadow-2xl shadow-brand-soft/20 border-white overflow-hidden">
      {/* Mobile scroll hint */}
      <div className="flex items-center gap-2 px-6 pt-5 pb-0 sm:hidden">
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px]">← Scroll to see all →</div>
      </div>

      <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-brand-soft scrollbar-track-transparent">
        <table className="w-full text-left border-collapse" style={{ minWidth: '640px' }}>
          <thead className="bg-[#F5EDE4]/60 border-b border-brand-soft/20">
            <tr>
              {['Order', 'Category Name', 'Description', 'Status', 'Actions'].map((h, i) => (
                <th key={h} className={`px-8 py-6 text-[10px] uppercase tracking-[3px] font-black text-gray-400 whitespace-nowrap ${i === 3 ? 'text-center' : i === 4 ? 'text-right' : ''}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100/60">
            {loading ? (
              <tr>
                <td colSpan="5" className="py-32">
                  <div className="flex flex-col items-center justify-center gap-4 text-gray-400">
                    <Loader2 className="w-10 h-10 animate-spin text-brand" />
                    <p className="font-black tracking-[4px] text-[10px] uppercase text-gray-400">Loading...</p>
                  </div>
                </td>
              </tr>
            ) : categories.length > 0 ? (
              categories.map((cat) => (
                <CategoryRow key={cat._id} category={cat} onEdit={onEdit} onDelete={onDelete} />
              ))
            ) : (
              <tr>
                <td colSpan="5" className="py-24 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center">
                      <LayoutGrid className="w-7 h-7 text-brand/40" />
                    </div>
                    <p className="font-black text-gray-400 uppercase tracking-[3px] text-xs">No categories yet</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoryTable;