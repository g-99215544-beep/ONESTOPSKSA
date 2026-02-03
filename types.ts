export interface SchoolApp {
  id: string;
  name: string;
  category: string;
  icon: string;
  url: string;
  accessCount: number;
  createdAt: string;
}

export type ViewMode = 'grid' | 'list';

export const CATEGORIES = [
  { id: 'pentadbiran', label: 'Pentadbiran', color: 'bg-blue-900/30 text-blue-400 border-blue-800' },
  { id: 'kurikulum', label: 'Kurikulum', color: 'bg-emerald-900/30 text-emerald-400 border-emerald-800' },
  { id: 'hem', label: 'HEM', color: 'bg-orange-900/30 text-orange-400 border-orange-800' },
  { id: 'kokurikulum', label: 'Kokurikulum', color: 'bg-red-900/30 text-red-400 border-red-800' },
  { id: 'lain-lain', label: 'Lain-lain', color: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
] as const;