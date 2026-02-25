import React from 'react';
import { X } from 'lucide-react';

const ServiceForm = ({ form, setForm, onSubmit, onClose, isEditing, categories }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">

      {/* Panel */}
      <div className="bg-[#F5EDE4] w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] p-6 sm:p-10 shadow-2xl border border-brand-soft/30 max-h-[95dvh] overflow-y-auto">

        {/* Header */}
        <div className="flex justify-between items-start mb-10">
          <div>
            <h2 className="text-3xl font-serif italic text-gray-900 leading-tight">
              {isEditing ? 'Update' : 'New'}{' '}
              <span className="text-[#22B8C8]">Service</span>
            </h2>
            <div className="h-1 w-14 bg-brand mt-3 rounded-full"></div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 bg-white/60 rounded-full hover:rotate-90 hover:bg-white transition-all duration-300 border border-brand-soft/30"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">

          {/* Service Name */}
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[3px] block mb-2 ml-1">
              Service Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Deep Cleansing Facial"
              className="w-full px-6 py-4 bg-white/80 border border-transparent focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-2xl outline-none transition-all text-gray-900 placeholder:text-gray-300 font-medium"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[3px] block mb-2 ml-1">
              Category
            </label>
            <select
              required
              className="w-full px-6 py-4 bg-white/80 border border-transparent focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-2xl outline-none transition-all font-medium text-gray-900 appearance-none cursor-pointer"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="">-- Select a category --</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[3px] block mb-2 ml-1">
              Description
            </label>
            <textarea
              rows="3"
              placeholder="Brief details about this service..."
              className="w-full px-6 py-4 bg-white/80 border border-transparent focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-2xl outline-none transition-all text-gray-900 resize-none placeholder:text-gray-300 font-medium"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* Duration + Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[3px] block mb-2 ml-1">
                Duration (mins)
              </label>
              <input
                type="number"
                required
                min="15"
                max="480"
                placeholder="60"
                className="w-full px-6 py-4 bg-white/80 border border-transparent focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-2xl outline-none transition-all font-black text-gray-900"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[3px] block mb-2 ml-1">
                Price (€)
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="50.00"
                className="w-full px-6 py-4 bg-white/80 border border-transparent focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-2xl outline-none transition-all font-black text-gray-900"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
          </div>

          {/* Deposit % + Gender */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[3px] block mb-2 ml-1">
                Deposit (0–1)
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.05"
                placeholder="0.30"
                className="w-full px-6 py-4 bg-white/80 border border-transparent focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-2xl outline-none transition-all font-black text-gray-900"
                value={form.depositPercentage}
                onChange={(e) => setForm({ ...form, depositPercentage: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[3px] block mb-2 ml-1">
                Gender
              </label>
              <select
                className="w-full px-6 py-4 bg-white/80 border border-transparent focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-2xl outline-none transition-all font-black text-gray-900 appearance-none cursor-pointer"
                value={form.genderRestriction}
                onChange={(e) => setForm({ ...form, genderRestriction: e.target.value })}
              >
                <option value="all">All</option>
                <option value="female-only">Female Only</option>
                <option value="male-only">Male Only</option>
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[3px] block mb-2 ml-1">
              Status
            </label>
            <select
              className="w-full px-6 py-4 bg-white/80 border border-transparent focus:border-brand focus:ring-2 focus:ring-brand/20 rounded-2xl outline-none transition-all font-black text-gray-900 appearance-none cursor-pointer"
              value={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}
            >
              <option value="true">Active</option>
              <option value="false">Hidden</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4">
            <button
              type="submit"
              className="w-full bg-brand hover:bg-[#24a1ad] py-5 rounded-2xl font-black text-white shadow-xl shadow-brand/20 transition-all active:scale-[0.98] uppercase tracking-widest text-xs"
            >
              {isEditing ? 'Update Service' : 'Create Service'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-4 font-bold text-gray-400 hover:text-[#B62025] transition-colors uppercase tracking-widest text-[10px]"
            >
              Cancel and go back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceForm;