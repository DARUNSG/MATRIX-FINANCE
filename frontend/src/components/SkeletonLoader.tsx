import React from 'react';

export const StatCardSkeleton: React.FC = () => (
  <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse space-y-3">
    <div className="flex items-center justify-between">
      <div className="w-24 h-4 bg-slate-800 rounded" />
      <div className="w-9 h-9 bg-slate-800 rounded-xl" />
    </div>
    <div className="w-32 h-8 bg-slate-800 rounded" />
    <div className="w-20 h-3 bg-slate-800 rounded" />
  </div>
);

export const TableRowSkeleton: React.FC = () => (
  <tr className="animate-pulse border-b border-slate-800/60">
    <td className="p-4"><div className="w-24 h-4 bg-slate-800 rounded" /></td>
    <td className="p-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-800" /><div className="w-28 h-4 bg-slate-800 rounded" /></div></td>
    <td className="p-4"><div className="w-20 h-4 bg-slate-800 rounded" /></td>
    <td className="p-4"><div className="w-20 h-4 bg-slate-800 rounded" /></td>
    <td className="p-4"><div className="w-16 h-6 bg-slate-800 rounded-full" /></td>
  </tr>
);
