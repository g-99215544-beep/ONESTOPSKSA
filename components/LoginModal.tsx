import React, { useState, useEffect, useRef } from 'react';
import { Lock, X, LogIn } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

const ADMIN_PASSWORD = 'admin123';

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      onLogin();
      onClose();
    } else {
      setError(true);
      setPassword('');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
    if (e.key === 'Escape') onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-all">
      <div className="bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-[popIn_0.3s_ease] border border-zinc-800">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-500" /> Admin Access
            </h2>
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
              <X size={20} />
            </button>
          </div>

          {error && (
            <div className="bg-red-900/30 text-red-400 p-3 rounded-lg mb-4 text-sm font-medium text-center border border-red-900/50 animate-pulse">
              Kata laluan salah.
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Kata Laluan</label>
              <input
                ref={inputRef}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-black text-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all placeholder:text-zinc-600"
                placeholder="••••••••"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 font-semibold hover:bg-zinc-800 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleLogin}
                className="px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-900/20"
              >
                <LogIn size={18} /> Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};