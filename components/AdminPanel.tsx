import React, { useState, useEffect } from 'react';
import { PlusCircle, Link, Image, Type, LayoutGrid, Save, Edit } from 'lucide-react';
import { CATEGORIES, SchoolApp } from '../types';
import { addNewApp, updateApp } from '../services/firebase';
import { AppIcon } from './AppIcon';

interface AdminPanelProps {
  onClose: () => void;
  appToEdit?: SchoolApp | null;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, appToEdit }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    icon: '',
    url: ''
  });

  useEffect(() => {
    if (appToEdit) {
      setFormData({
        name: appToEdit.name,
        category: appToEdit.category,
        icon: appToEdit.icon,
        url: appToEdit.url
      });
    } else {
      setFormData({ name: '', category: '', icon: '', url: '' });
    }
  }, [appToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category || !formData.url) return;

    setLoading(true);
    try {
      if (appToEdit) {
        await updateApp(appToEdit.id, formData);
        alert('✅ App berjaya dikemaskini!');
      } else {
        await addNewApp({
          ...formData,
          accessCount: 0,
          createdAt: new Date().toISOString()
        });
        alert('✅ App berjaya ditambah!');
      }
      onClose(); // Close panel after success
    } catch (error) {
      alert('❌ Error processing request');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl shadow-black p-4 md:p-6 mb-8 animate-[slideDown_0.3s_ease]">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800">
        <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
          {appToEdit ? <Edit className="w-5 h-5 text-blue-500" /> : <PlusCircle className="w-5 h-5 text-blue-500" />}
          {appToEdit ? 'Kemaskini App' : 'Tambah App Baru'}
        </h2>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-xs md:text-sm font-medium transition-colors">
          Tutup Panel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div className="space-y-4 md:space-y-5">
          <div>
            <label className="block text-sm font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <Type size={14} className="text-zinc-500" /> Nama App
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-zinc-700 bg-black text-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all placeholder:text-zinc-600"
              placeholder="Contoh: Unit Kokurikulum"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <LayoutGrid size={14} className="text-zinc-500" /> Kategori
            </label>
            <div className="relative">
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-700 bg-black text-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none appearance-none cursor-pointer"
                required
              >
                <option value="">-- Pilih Kategori --</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
               <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <Link size={14} className="text-zinc-500" /> URL Web App
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-zinc-700 bg-black text-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all placeholder:text-zinc-600"
              placeholder="https://..."
              required
            />
          </div>
        </div>

        <div className="space-y-4 md:space-y-5">
          <div>
            <label className="block text-sm font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <Image size={14} className="text-zinc-500" /> URL Icon (Image)
            </label>
            <input
              type="url"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-zinc-700 bg-black text-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all placeholder:text-zinc-600"
              placeholder="https://..."
              required
            />
          </div>

          <div className="bg-black rounded-xl p-4 flex items-center justify-center min-h-[140px] border-2 border-dashed border-zinc-800 transition-colors hover:border-zinc-700">
            {formData.icon ? (
              <div className="text-center">
                <div className="mb-2 text-xs text-zinc-500 uppercase tracking-wider font-semibold">Preview</div>
                <AppIcon src={formData.icon} alt="Preview" className="w-20 h-20 rounded-xl shadow-md mx-auto object-cover bg-zinc-900" />
              </div>
            ) : (
              <div className="text-center text-zinc-600">
                <Image className="mx-auto mb-2 opacity-50" size={24} />
                <span className="text-sm">Preview icon akan muncul di sini</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-900/20 hover:bg-blue-500 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none mt-2 flex items-center justify-center gap-2"
          >
            {loading ? 'Sedang Diproses...' : (appToEdit ? <><Save size={18}/> Simpan Perubahan</> : <><PlusCircle size={18}/> Tambah App</>)}
          </button>
        </div>
      </form>
    </div>
  );
};