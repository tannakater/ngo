import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  FolderCheck, 
  ExternalLink, 
  RefreshCw, 
  HardDrive, 
  CheckCircle2, 
  AlertCircle,
  Image as ImageIcon,
  FileText,
  Sparkles,
  Shield,
  Lock,
  Database
} from 'lucide-react';
import { 
  syncAllNgoFolders, 
  FOLDER_CONFIGS, 
  DriveFolderDetails, 
  StorageCategory,
  getStorageMode,
  setStorageMode,
  StorageMode 
} from '../lib/storage';
import { getAccessToken } from '../lib/auth';

export function DriveFolderManager() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const [rootFolder, setRootFolder] = useState<{ id: string; name: string; url: string } | null>(null);
  const [folders, setFolders] = useState<DriveFolderDetails[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [storageMode, setLocalMode] = useState<StorageMode>(getStorageMode());

  useEffect(() => {
    checkConnection();
  }, []);

  const handleModeChange = (mode: StorageMode) => {
    setStorageMode(mode);
    setLocalMode(mode);
  };

  const checkConnection = async () => {
    const token = await getAccessToken();
    setHasToken(!!token);

    // Check cached root folder
    const savedRootId = localStorage.getItem('gdrive_root_ngo_folder_id');
    const savedSubfoldersStr = localStorage.getItem('gdrive_subfolders_cache');

    if (savedRootId) {
      setRootFolder({
        id: savedRootId,
        name: 'NGO',
        url: `https://drive.google.com/drive/folders/${savedRootId}`
      });
    }

    const initialList: DriveFolderDetails[] = (Object.keys(FOLDER_CONFIGS) as StorageCategory[]).map(cat => {
      let subId: string | null = null;
      if (savedSubfoldersStr) {
        try {
          const parsed = JSON.parse(savedSubfoldersStr);
          subId = parsed[cat] || null;
        } catch (e) {}
      }
      return {
        category: cat,
        name: FOLDER_CONFIGS[cat].name,
        description: FOLDER_CONFIGS[cat].description,
        folderId: subId,
        driveUrl: subId ? `https://drive.google.com/drive/folders/${subId}` : null
      };
    });
    setFolders(initialList);
  };

  const handleSyncFolders = async () => {
    setIsSyncing(true);
    setErrorMessage(null);
    setStatusMessage('Syncing with Google Drive and arranging folders under "NGO"...');

    try {
      const result = await syncAllNgoFolders();
      setRootFolder(result.rootFolder);
      setFolders(result.subfolders);
      setStatusMessage('All folders verified and properly arranged in Google Drive!');
    } catch (err: any) {
      console.error('Drive sync error:', err);
      setErrorMessage(err.message || 'Failed to sync with Google Drive. Please ensure you are logged in with Google.');
    } finally {
      setIsSyncing(false);
    }
  };

  const getCategoryIcon = (category: StorageCategory) => {
    switch (category) {
      case 'idcardimg':
        return <ImageIcon className="w-5 h-5 text-indigo-500" />;
      case 'eventimg':
        return <Sparkles className="w-5 h-5 text-emerald-500" />;
      case 'branding':
        return <Folder className="w-5 h-5 text-amber-500" />;
      case 'documents':
        return <FileText className="w-5 h-5 text-rose-500" />;
      default:
        return <Folder className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <HardDrive className="w-6 h-6 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">Media Storage & Drive Manager</h2>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              {storageMode === 'local' ? 'Private Web Mode' : 'Drive Cloud Mode'}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Control how photos and assets are stored and keep your personal Google Drive completely restricted and private.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSyncFolders}
          disabled={isSyncing}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 transition-all gap-2 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Arranging Folders...' : 'Sync Folders in Drive'}
        </button>
      </div>

      {/* Storage Mode Toggle Card */}
      <div className="mx-6 mt-6 p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100/70 border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Storage & Privacy Mode</h3>
            </div>
            <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
              Choose whether assets are stored directly in web storage (keeping your Google Drive 100% private to only you) or uploaded to Google Drive.
            </p>
          </div>

          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm shrink-0">
            <button
              type="button"
              onClick={() => handleModeChange('local')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                storageMode === 'local'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Private Web Storage (Recommended)
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('gdrive')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                storageMode === 'gdrive'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              Google Drive Cloud
            </button>
          </div>
        </div>

        {storageMode === 'local' && (
          <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-start gap-2.5 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>100% Private & Protected:</strong> Your Google Drive folder can remain completely <strong>"Restricted"</strong>. Uploaded photos are stored as optimized local assets, so all website visitors see images perfectly with zero Google Drive access and zero permission errors.
            </span>
          </div>
        )}
      </div>

      {statusMessage && (
        <div className="mx-6 mt-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mx-6 mt-6 p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-3 text-amber-800 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Root NGO Folder Card */}
        <div className="bg-gradient-to-r from-emerald-500/10 via-blue-500/5 to-transparent p-5 rounded-xl border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              <FolderCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Root Primary Folder
                </span>
                <span className="text-xs text-slate-400 font-mono">/NGO</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">📁 NGO</h3>
              <p className="text-xs text-slate-600">The single top-level parent folder containing all subfolders and assets.</p>
            </div>
          </div>

          {rootFolder?.url ? (
            <a
              href={rootFolder.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-50 shadow-sm transition-colors shrink-0"
            >
              Open "NGO" in Drive <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <span className="text-xs text-slate-500 italic bg-white px-3 py-1.5 rounded-lg border border-slate-200">
              Click "Sync & Create" to initialize in Drive
            </span>
          )}
        </div>

        {/* Subfolders Grid */}
        <div>
          <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <span>Arranged Subfolders inside <strong className="text-emerald-700">/NGO</strong></span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {folders.map((folder) => (
              <div
                key={folder.category}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                      {getCategoryIcon(folder.category)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900">
                          {folder.name}
                        </span>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-200/60 px-1.5 py-0.2 rounded">
                          folder
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {folder.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] text-slate-500 truncate max-w-[170px]">
                    NGO/{folder.name}/
                  </span>
                  
                  {folder.driveUrl ? (
                    <a
                      href={folder.driveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      View in Drive <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-slate-400">Ready for auto-creation</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info box explaining the auto-routing */}
        <div className="p-4 rounded-lg bg-blue-50/70 border border-blue-100 text-xs text-blue-800 flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <div className="leading-relaxed">
            <strong>Automated Routing Active:</strong> Whenever you upload a member or volunteer photo, generate an ID card, or upload event media, IDForge automatically detects the asset type and files it directly into <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">NGO/{'<subfolder>'}</code>. No manual organization required!
          </div>
        </div>
      </div>
    </div>
  );
}
