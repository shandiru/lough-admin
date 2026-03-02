import React from 'react';
import { Plus, LayoutGrid } from 'lucide-react';

const CategoryHeader = ({ count, loading, onCreateOpen }) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 sm:mb-12">
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-xl bg-brand/15 flex items-center justify-center">
          <LayoutGrid className="w-4 h-4 text-brand" />
        </div>
        <span className="text-[10px] font-black text-brand uppercase tracking-[3px]">Lough Skin Admin</span>
      </div>
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 tracking-tighter leading-none">
        Product <span className="text-[#22B8C8]">Categories</span>
      </h1>
      <div className="flex items-center gap-2 mt-3">
        <div className="w-8 h-[2px] bg-brand rounded-full"></div>
        <span className="text-xs text-gray-400 font-medium">
          {!loading && `${count} ${count === 1 ? 'category' : 'categories'}`}
        </span>
      </div>
    </div>

    <button
      onClick={onCreateOpen}
      className="flex items-center justify-center gap-2 bg-brand hover:bg-[#24a1ad] text-white px-7 py-4 rounded-2xl font-black transition-all shadow-xl shadow-brand/20 active:scale-95 group self-start sm:self-auto shrink-0"
    >
      <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
      <span className="uppercase tracking-wider text-sm">Create New</span>
    </button>
  </div>
);

export default CategoryHeader;