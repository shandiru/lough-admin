import React from 'react';
import { X } from 'lucide-react';

const CategoryForm = ({ form, setForm, onSubmit, onClose, isEditing }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      
      {/* Panel */}
      <div className="bg-[#F5EDE4] dark:bg-[#0A0A0A] w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] p-6 sm:p-10 shadow-2xl border border-brand-soft/30 dark:border-white/5 max-h-[95dvh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-10">
          <div>
            <h2 className="text-3xl font-serif italic text-gray-900 dark:text-white leading-tight">
              {isEditing ? 'Update' : 'New'}{' '}
              <span className="text-[#B62025] dark:text-[#FF4B4B]">Category</span>
            </h2>
            <div className="h-1 w-14 bg-brand mt-3 rounded-full"></div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 bg-white/60 dark:bg-white/5 rounded-full hover:rotate-90 hover:bg-white dark:hover:bg-white/10 transition-all duration-300 border border-brand-soft/30 dark:border-white/10"
          >
            <X className="w-5 h-5 text-gray-700 dark:text-white" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">

          {/* Category Name */}
          <div>
            <label className="text-[10px] font-black text-gray-500 dark:text-gray-500 uppercase tracking-[3px] block mb-2 ml-1">
              Category Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Moisturizers"
              className="w-full px-6 py-4 bg-white/80 dark:bg-white/5 border border-transparent focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-2xl outline-none transition-all text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-700 font-medium"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-black text-gray-500 dark:text-gray-500 uppercase tracking-[3px] block mb-2 ml-1">
              Description
            </label>
            <textarea
              rows="3"
              placeholder="Brief details about this category..."
              className="w-full px-6 py-4 bg-white/80 dark:bg-white/5 border border-transparent focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-2xl outline-none transition-all text-gray-900 dark:text-white resize-none placeholder:text-gray-300 dark:placeholder:text-gray-700 font-medium"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* Order + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-gray-500 dark:text-gray-500 uppercase tracking-[3px] block mb-2 ml-1">
                Display Order
              </label>
              <input
                type="number"
                min="0"
                className="w-full px-6 py-4 bg-white/80 dark:bg-white/5 border border-transparent focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-2xl outline-none transition-all font-black text-gray-900 dark:text-white"
                value={form.displayOrder}
                onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-500 dark:text-gray-500 uppercase tracking-[3px] block mb-2 ml-1">
                Status
              </label>
              <select
                className="w-full px-6 py-4 bg-white/80 dark:bg-white/5 border border-transparent focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-2xl outline-none transition-all font-black text-gray-900 dark:text-white appearance-none cursor-pointer"
                value={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}
              >
                <option value="true">Active</option>
                <option value="false">Hidden</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4">
            <button
              type="submit"
              className="w-full bg-brand hover:bg-[#24a1ad] py-5 rounded-2xl font-black text-white shadow-xl shadow-brand/20 transition-all active:scale-[0.98] uppercase tracking-widest text-xs"
            >
              {isEditing ? 'Update Category' : 'Create Category'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-4 font-bold text-gray-400 dark:text-gray-600 hover:text-[#B62025] dark:hover:text-[#FF4B4B] transition-colors uppercase tracking-widest text-[10px]"
            >
              Cancel and go back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryForm;