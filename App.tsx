import React, { useEffect, useState } from 'react';
import { Settings, Grid, List, Search, Eye, ExternalLink, Trash2, XCircle, LayoutGrid, Plus, Edit2, LogOut, EyeOff, GripVertical, CheckCircle, Download } from 'lucide-react';
import { SchoolApp, ViewMode, CATEGORIES } from './types';
import { subscribeToApps, incrementAppAccess, removeApp } from './services/firebase';
import { AppIcon } from './components/AppIcon';
import { LoginModal } from './components/LoginModal';
import { AdminPanel } from './components/AdminPanel';

function App() {
  const [apps, setApps] = useState<SchoolApp[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Auth state
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  
  // Admin Panel state
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [editingApp, setEditingApp] = useState<SchoolApp | null>(null);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // User Preferences (LocalStorage)
  const [customOrder, setCustomOrder] = useState<string[]>([]);
  const [hiddenAppIds, setHiddenAppIds] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);

  // PWA Install State
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Load Preferences on Mount
  useEffect(() => {
    const savedOrder = localStorage.getItem('sri_aman_apps_order');
    const savedHidden = localStorage.getItem('sri_aman_apps_hidden');
    
    if (savedOrder) setCustomOrder(JSON.parse(savedOrder));
    if (savedHidden) setHiddenAppIds(JSON.parse(savedHidden));

    // PWA Install Event Listener
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Save Preferences on Change
  useEffect(() => {
    localStorage.setItem('sri_aman_apps_order', JSON.stringify(customOrder));
  }, [customOrder]);

  useEffect(() => {
    localStorage.setItem('sri_aman_apps_hidden', JSON.stringify(hiddenAppIds));
  }, [hiddenAppIds]);

  // Initial Data Load
  useEffect(() => {
    const unsubscribe = subscribeToApps((loadedApps) => {
      setApps(loadedApps);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- Logic for Filtering and Sorting ---
  
  // 1. Filter by Search and Category
  let processedApps = apps.filter(app => {
    const matchesCategory = filterCategory === 'all' || app.category === filterCategory;
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // 2. Filter Hidden (unless showHidden is true or we are in Admin mode)
  if (!showHidden && !isAdmin) {
    processedApps = processedApps.filter(app => !hiddenAppIds.includes(app.id));
  }

  // 3. Apply Sorting
  // If viewing "All" and no search, apply custom Drag & Drop order.
  // Otherwise, fallback to alphabetical or access count (for list view).
  const isCustomSortActive = filterCategory === 'all' && !searchQuery && viewMode === 'grid';

  if (isCustomSortActive) {
    processedApps.sort((a, b) => {
      const indexA = customOrder.indexOf(a.id);
      const indexB = customOrder.indexOf(b.id);
      
      // Items not in customOrder go to the end
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      
      return indexA - indexB;
    });
  } else if (viewMode === 'list') {
    processedApps.sort((a, b) => (b.accessCount || 0) - (a.accessCount || 0));
  }

  // --- Handlers ---

  const handleAppClick = (app: SchoolApp) => {
    // If hidden and just viewing, don't allow click (optional UX, but allowing it lets them test)
    incrementAppAccess(app.id);
    window.open(app.url, '_blank', 'noopener,noreferrer');
  };

  const handleDelete = async (e: React.MouseEvent, appId: string) => {
    e.stopPropagation();
    if (window.confirm('Adakah anda pasti mahu memadam app ini?')) {
      await removeApp(appId);
    }
  };

  const handleEdit = (e: React.MouseEvent, app: SchoolApp) => {
    e.stopPropagation();
    setEditingApp(app);
    setShowAdminPanel(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddNew = () => {
    setEditingApp(null);
    setShowAdminPanel(true);
  };

  const toggleHideApp = (e: React.MouseEvent, appId: string) => {
    e.stopPropagation();
    if (hiddenAppIds.includes(appId)) {
      setHiddenAppIds(prev => prev.filter(id => id !== appId));
    } else {
      setHiddenAppIds(prev => [...prev, appId]);
    }
  };

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    // Show the install prompt
    installPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await installPrompt.userChoice;
    // We've used the prompt, and can't use it again, throw it away
    setInstallPrompt(null);
  };

  // --- Drag and Drop Handlers ---
  
  const handleDragStart = (e: React.DragEvent, appId: string) => {
    if (!isCustomSortActive) return;
    setDraggedAppId(appId);
    e.dataTransfer.effectAllowed = "move";
    // Transparent drag image hack if needed, but default ghost is usually fine
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isCustomSortActive) return;
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetAppId: string) => {
    if (!isCustomSortActive || !draggedAppId || draggedAppId === targetAppId) return;
    e.preventDefault();

    const currentOrder = customOrder.length > 0 
      ? [...customOrder] 
      : apps.map(a => a.id); // Initialize if empty

    // Ensure both IDs are in the order array (handle new apps)
    if (!currentOrder.includes(draggedAppId)) currentOrder.push(draggedAppId);
    if (!currentOrder.includes(targetAppId)) currentOrder.push(targetAppId);

    const fromIndex = currentOrder.indexOf(draggedAppId);
    const toIndex = currentOrder.indexOf(targetAppId);

    // Reorder
    currentOrder.splice(fromIndex, 1);
    currentOrder.splice(toIndex, 0, draggedAppId);

    setCustomOrder(currentOrder);
    setDraggedAppId(null);
  };

  const getCategoryData = (catId: string) => {
    const cat = CATEGORIES.find(c => c.id === catId);
    return cat || { label: catId, color: 'bg-zinc-800 text-zinc-400 border-zinc-700' };
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-blue-900">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
        
        {/* Compact Header */}
        <header className="flex flex-row justify-between items-center mb-6 pt-2">
          <div>
            <h1 className="text-xl md:text-3xl font-extrabold text-white tracking-tight leading-none uppercase">
              SRI AMAN Apps
            </h1>
            <p className="text-zinc-400 text-sm hidden md:block mt-1">
              Portal sehenti aplikasi sekolah anda.
            </p>
          </div>

          <div className="flex gap-2 items-center">
            
            {/* PWA Install Button - Only shows if installable */}
            {installPrompt && (
              <button
                onClick={handleInstallClick}
                className="px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-2 text-[10px] md:text-sm font-semibold shadow-lg shadow-emerald-900/30 animate-[pulse_3s_infinite]"
              >
                <Download size={14} className="md:w-4 md:h-4" />
                <span className="hidden sm:inline">Install</span>
              </button>
            )}

            {isAdmin && (
               <button
                 onClick={handleAddNew}
                 className="px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-all flex items-center gap-2 text-[10px] md:text-sm font-semibold shadow-lg shadow-blue-900/30"
               >
                 <Plus size={14} className="md:w-4 md:h-4" />
                 <span className="hidden sm:inline">Tambah App</span>
               </button>
            )}

            <button
              onClick={() => isAdmin ? setIsAdmin(false) : setIsLoginOpen(true)}
              className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full border transition-all flex items-center gap-2 text-[10px] md:text-sm font-semibold shadow-sm ${
                isAdmin
                  ? 'bg-zinc-900 border-zinc-700 text-red-400 hover:bg-zinc-800 hover:text-red-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {isAdmin ? <LogOut size={14} className="md:w-4 md:h-4" /> : <Settings size={14} className="md:w-4 md:h-4" />}
              <span className="hidden sm:inline">{isAdmin ? 'Keluar' : 'Admin'}</span>
            </button>
          </div>
        </header>

        {/* Admin Login Modal */}
        <LoginModal
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
          onLogin={() => setIsAdmin(true)}
        />

        {/* Admin Panel */}
        {isAdmin && showAdminPanel && (
          <AdminPanel 
            onClose={() => { setShowAdminPanel(false); setEditingApp(null); }} 
            appToEdit={editingApp}
          />
        )}

        {/* Compact Toolbar */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-sm p-2 mb-6 sticky top-2 z-30">
          <div className="flex flex-col md:flex-row gap-2">
            
            {/* Top Row: Search (Expand) + View Toggle (Mobile) */}
            <div className="flex gap-2 w-full md:w-auto md:flex-1">
              <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                 <input
                   type="text"
                   placeholder="Cari aplikasi..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="pl-9 pr-3 py-2 rounded-lg border border-zinc-700 bg-black focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none w-full transition-all text-sm text-zinc-200 placeholder:text-zinc-600"
                 />
              </div>
              
              {/* Mobile View Toggle */}
              <div className="flex md:hidden bg-black p-1 rounded-lg shrink-0 border border-zinc-800">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-zinc-500'
                  }`}
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === 'list' ? 'bg-zinc-800 text-white' : 'text-zinc-500'
                  }`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
            
            {/* Bottom Row Mobile / Inline Desktop: Category + Desktop Toggle */}
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-48">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 rounded-lg border border-zinc-700 bg-black focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none appearance-none cursor-pointer text-sm font-medium text-zinc-300 truncate"
                >
                  <option value="all">Semua Kategori</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>

               {/* Show Hidden Toggle (Only visible if not filtering) */}
               <button
                  onClick={() => setShowHidden(!showHidden)}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-all border ${
                    showHidden 
                    ? 'bg-blue-900/20 border-blue-800 text-blue-400' 
                    : 'bg-black border-zinc-800 text-zinc-500 hover:text-zinc-300'
                  }`}
                  title={showHidden ? "Sembunyi App Tersembunyi" : "Papar App Tersembunyi"}
                >
                  {showHidden ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>

              {/* Desktop View Toggle */}
              <div className="hidden md:flex bg-black p-1 rounded-lg shrink-0 border border-zinc-800">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-all ${
                    viewMode === 'grid' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Grid size={16} /> Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-all ${
                    viewMode === 'list' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <List size={16} /> List
                </button>
              </div>
            </div>
          </div>
          
          {/* Helper Text for Drag and Drop */}
          {isCustomSortActive && viewMode === 'grid' && (
             <div className="mt-2 text-[10px] md:text-xs text-zinc-600 flex items-center gap-1">
               <GripVertical size={12} />
               <span>Drag & Drop untuk susun semula aplikasi.</span>
             </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <div className="animate-spin w-8 h-8 border-4 border-zinc-700 border-t-blue-500 rounded-full mb-3"></div>
            <p className="text-sm font-medium">Memuatkan...</p>
          </div>
        )}

        {/* Content Area */}
        {!loading && processedApps.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900 rounded-xl border border-dashed border-zinc-800 mx-2">
            <Search className="text-zinc-700 mx-auto mb-2" size={32} />
            <p className="text-zinc-500 text-sm">Tiada aplikasi dijumpai.</p>
          </div>
        ) : (
          <>
            {/* GRID VIEW */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-6">
                {processedApps.map(app => {
                  const catData = getCategoryData(app.category);
                  const isHidden = hiddenAppIds.includes(app.id);
                  const canDrag = isCustomSortActive;

                  return (
                    <div
                      key={app.id}
                      draggable={canDrag}
                      onDragStart={(e) => handleDragStart(e, app.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, app.id)}
                      onClick={() => handleAppClick(app)}
                      className={`group relative bg-zinc-900 rounded-xl border border-zinc-800 p-2 md:p-6 flex flex-col items-center text-center transition-all active:scale-95
                        ${canDrag ? 'cursor-move' : 'cursor-pointer'}
                        ${isHidden ? 'opacity-50 grayscale hover:opacity-100 hover:grayscale-0' : 'hover:border-blue-800 hover:shadow-lg hover:shadow-black/50'}
                      `}
                    >
                      {/* Category Badge (Top Right) */}
                      <span className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] border font-medium z-5 truncate max-w-[60%] ${catData.color}`}>
                        {catData.label}
                      </span>

                      {/* Hide/Unhide Button (Top Left) */}
                      {!isAdmin && (
                        <button
                          onClick={(e) => toggleHideApp(e, app.id)}
                          className={`absolute top-1 left-1 p-1 rounded-full z-10 transition-colors
                            ${isHidden
                              ? 'bg-blue-900/50 text-blue-400 hover:bg-blue-900'
                              : 'text-zinc-600 hover:text-white bg-black/20 hover:bg-black opacity-0 group-hover:opacity-100'
                            }`}
                            title={isHidden ? "Papar Semula" : "Sembunyi App"}
                        >
                          {isHidden ? <Eye size={12} /> : <EyeOff size={12} />}
                        </button>
                      )}

                      {/* Admin Controls (Bottom Right) */}
                      {isAdmin && (
                        <div className="absolute bottom-1 right-1 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleEdit(e, app)}
                            className="p-1 text-zinc-400 hover:text-blue-400 bg-black/80 hover:bg-black rounded-md transition-colors"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, app.id)}
                            className="p-1 text-zinc-400 hover:text-red-500 bg-black/80 hover:bg-black rounded-md transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}

                      <div className="mb-2 md:mb-4 pointer-events-none">
                        <AppIcon
                          src={app.icon}
                          alt={app.name}
                          className="w-10 h-10 sm:w-14 sm:h-14 md:w-24 md:h-24 rounded-xl shadow-md bg-zinc-800 object-cover"
                        />
                      </div>

                      <h3 className="text-zinc-200 font-semibold text-[10px] sm:text-xs md:text-base leading-tight line-clamp-2 group-hover:text-blue-400">
                        {app.name}
                      </h3>
                    </div>
                  );
                })}
              </div>
            )}

            {/* LIST VIEW */}
            {viewMode === 'list' && (
              <div className="flex flex-col gap-2 md:gap-3">
                {processedApps.map((app, index) => {
                  const catData = getCategoryData(app.category);
                  const isHidden = hiddenAppIds.includes(app.id);
                  
                  return (
                    <div
                      key={app.id}
                      onClick={() => handleAppClick(app)}
                      className={`group bg-zinc-900 rounded-lg border border-zinc-800 p-3 md:p-4 flex items-center gap-3 md:gap-4 shadow-sm cursor-pointer active:bg-black
                        ${isHidden ? 'opacity-50 grayscale' : 'hover:border-blue-800'}
                      `}
                    >
                      <div className="w-6 md:w-8 text-center font-mono text-xs md:text-sm text-zinc-600 font-medium">
                        {index + 1}
                      </div>
                      
                      <AppIcon src={app.icon} alt={app.name} className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover bg-zinc-800 border border-zinc-700" />
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm md:text-lg font-semibold text-zinc-200 truncate group-hover:text-blue-400">
                          {app.name}
                        </h3>
                        <div className="flex items-center gap-2 text-[10px] md:text-sm text-zinc-500">
                          <span className={`border px-1.5 rounded ${catData.color}`}>
                            {catData.label}
                          </span>
                          <span className="hidden sm:inline text-zinc-700">•</span>
                          <span className="hidden sm:flex items-center gap-1 truncate text-zinc-500">
                            {new URL(app.url).hostname}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 md:gap-3 pl-2">
                         {/* Toggle Hide (List View) */}
                        {!isAdmin && (
                          <button
                            onClick={(e) => toggleHideApp(e, app.id)}
                            className={`p-1.5 rounded-md transition-colors ${isHidden ? 'text-blue-400 bg-blue-900/30' : 'text-zinc-600 hover:text-white hover:bg-zinc-800'}`}
                          >
                             {isHidden ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                        )}

                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black text-zinc-400 text-xs md:text-sm font-semibold border border-zinc-800">
                          <Eye size={12} className="text-blue-600" />
                          {app.accessCount}
                        </div>
                        
                        {isAdmin && (
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => handleEdit(e, app)}
                              className="p-1.5 text-zinc-500 hover:text-blue-400 bg-black hover:bg-zinc-800 rounded-md transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={(e) => handleDelete(e, app.id)}
                              className="p-1.5 text-zinc-500 hover:text-red-500 bg-black hover:bg-zinc-800 rounded-md transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
