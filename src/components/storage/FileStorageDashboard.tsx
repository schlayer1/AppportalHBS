import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowLeft, 
  Folder, 
  FolderPlus, 
  Upload, 
  Download, 
  Eye, 
  Trash2, 
  Search, 
  HardDrive, 
  Sparkles, 
  Presentation, 
  Share2, 
  ChevronRight, 
  LayoutGrid, 
  List, 
  FileText, 
  FileImage, 
  FileAudio, 
  File, 
  Check, 
  ExternalLink,
  Edit2,
  X,
  AlertTriangle,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StorageFolder, StorageFile, StorageScope, StorageViewLayout } from '../../types/storageTypes';
import { 
  subscribeToStorage, 
  createStorageFolder, 
  updateStorageFolder, 
  deleteStorageFolder, 
  addStorageFileRecord, 
  updateStorageFileRecord, 
  deleteStorageFileRecord 
} from '../../services/storageFirestoreService';
import { uploadFileToR2, getR2DownloadUrl, deleteFileFromR2 } from '../../services/r2StorageService';
import { 
  formatFileSize, 
  formatDate, 
  getFileExtension, 
  sanitizeFileName, 
  ALLOWED_EXTENSIONS, 
  MAX_FILE_SIZE_BYTES, 
  TOTAL_STORAGE_QUOTA_BYTES 
} from '../../utils/fileUtils';
import { NewFolderModal } from './NewFolderModal';
import { FilePreviewModal } from './FilePreviewModal';

interface FileStorageDashboardProps {
  onBackToPortal: () => void;
  onOpenInKahoot?: (file: StorageFile, signedUrl: string) => void;
  onOpenInBoard?: (file: StorageFile, signedUrl: string) => void;
}

export const FileStorageDashboard: React.FC<FileStorageDashboardProps> = ({
  onBackToPortal,
  onOpenInKahoot,
  onOpenInBoard
}) => {
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [activeScope, setActiveScope] = useState<StorageScope>('personal');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<StorageFolder[]>([]);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [viewLayout, setViewLayout] = useState<StorageViewLayout>('grid');

  // Modals & Overlays
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<StorageFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreviewUrl, setIsLoadingPreviewUrl] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeUploads, setActiveUploads] = useState<{ id: string; name: string; progress: number }[]>([]);
  const [renameTarget, setRenameTarget] = useState<{ id: string; type: 'folder' | 'file'; name: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'folder' | 'file'; name: string; r2Key?: string } | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Auto-hide notifications
  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(t);
  }, [notification]);

  // Subscribe to storage in Firestore
  useEffect(() => {
    const unsub = subscribeToStorage(({ folders: fList, files: flList }) => {
      setFolders(fList);
      setFiles(flList);
    });
    return unsub;
  }, []);

  // Filter folders & files according to current scope, current folder, and search query
  const isSharedScope = activeScope === 'shared';

  const currentFolder = useMemo(() => {
    if (!currentFolderId) return null;
    return folders.find((f) => f.id === currentFolderId) || null;
  }, [folders, currentFolderId]);

  // Build breadcrumb trail
  const breadcrumbs = useMemo(() => {
    const crumbs: { id: string | null; name: string }[] = [
      { id: null, name: isSharedScope ? 'Kollegiums-Austausch' : 'Mein Speicher' }
    ];
    let curr = currentFolder;
    const trail: { id: string; name: string }[] = [];
    while (curr) {
      trail.unshift({ id: curr.id, name: curr.name });
      curr = curr.parentId ? folders.find((f) => f.id === curr?.parentId) || null : null;
    }
    return [...crumbs, ...trail];
  }, [currentFolder, folders, isSharedScope]);

  // Filter folders for current view
  const visibleFolders = useMemo(() => {
    return folders.filter((folder) => {
      if (searchQuery.trim()) {
        const matchesScope = isSharedScope ? folder.isShared : (!folder.isShared && folder.ownerId === currentUser?.id);
        const matchesSearch = folder.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesScope && matchesSearch;
      }
      if (isSharedScope) {
        return folder.isShared && folder.parentId === currentFolderId;
      } else {
        const isOwner = folder.ownerId === (currentUser?.id || 'guest');
        return !folder.isShared && isOwner && folder.parentId === currentFolderId;
      }
    });
  }, [folders, isSharedScope, currentFolderId, searchQuery, currentUser]);

  // Filter files for current view
  const visibleFiles = useMemo(() => {
    return files.filter((file) => {
      // Scope Check
      const matchesScope = isSharedScope 
        ? file.isShared 
        : (!file.isShared && file.ownerId === (currentUser?.id || 'guest'));
      if (!matchesScope) return false;

      // Subject filter
      if (subjectFilter !== 'all' && file.subject !== subjectFilter) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          file.name.toLowerCase().includes(q) ||
          file.ownerName.toLowerCase().includes(q) ||
          (file.subject && file.subject.toLowerCase().includes(q))
        );
      }

      // Hierarchy (only show files inside the current folder)
      return file.folderId === currentFolderId;
    });
  }, [files, isSharedScope, currentFolderId, searchQuery, subjectFilter, currentUser]);

  // Quota Calculation (Total files across R2)
  const quotaInfo = useMemo(() => {
    const totalBytes = files.reduce((acc, f) => acc + (f.fileSize || 0), 0);
    const percentUsed = Math.min(100, Math.round((totalBytes / TOTAL_STORAGE_QUOTA_BYTES) * 100));
    return {
      totalBytes,
      fileCount: files.length,
      percentUsed,
      formattedUsed: formatFileSize(totalBytes),
      formattedTotal: formatFileSize(TOTAL_STORAGE_QUOTA_BYTES)
    };
  }, [files]);

  // Upload handler
  const handleFileUpload = async (fileList: FileList | File[]) => {
    if (!fileList || fileList.length === 0) return;
    const filesArray = Array.from(fileList);

    for (const file of filesArray) {
      const ext = getFileExtension(file.name);
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setNotification({
          type: 'error',
          message: `Dateiformat .${ext.toUpperCase()} ist nicht erlaubt. Bitte nur Dokumente, Bilder und Audios nutzen.`
        });
        continue;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setNotification({
          type: 'error',
          message: `Die Datei „${file.name}“ überschreitet das Limit von 30 MB.`
        });
        continue;
      }

      const uploadId = `upl_${Date.now()}_${Math.random()}`;
      setActiveUploads((prev) => [...prev, { id: uploadId, name: file.name, progress: 0 }]);

      try {
        const sanitized = sanitizeFileName(file.name);
        const teacherId = currentUser?.id || 'kollege';
        const targetKey = isSharedScope
          ? `shared/${currentFolder?.subject || 'allgemein'}/${Date.now()}_${sanitized}`
          : `users/${teacherId}/${Date.now()}_${sanitized}`;

        // Upload to Cloudflare R2 via presigned URL
        const uploadResult = await uploadFileToR2(file, targetKey, (pct) => {
          setActiveUploads((prev) =>
            prev.map((u) => (u.id === uploadId ? { ...u, progress: pct } : u))
          );
        });

        // Add file metadata to Firestore
        await addStorageFileRecord({
          name: file.name,
          folderId: currentFolderId,
          isShared: isSharedScope,
          ownerId: currentUser?.id || 'guest',
          ownerName: currentUser?.name || 'Kollege',
          r2Key: uploadResult.key,
          fileSize: uploadResult.fileSize,
          mimeType: uploadResult.mimeType,
          fileExtension: ext,
          subject: currentFolder?.subject || 'Allgemein'
        });

        setNotification({
          type: 'success',
          message: `„${file.name}“ erfolgreich in Cloudflare R2 gespeichert!`
        });
      } catch (err: any) {
        console.error('Upload-Fehler:', err);
        setNotification({
          type: 'error',
          message: err?.message || `Fehler beim Hochladen von „${file.name}“.`
        });
      } finally {
        setActiveUploads((prev) => prev.filter((u) => u.id !== uploadId));
      }
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  // Download handler
  const handleDownload = async (file: StorageFile) => {
    try {
      const url = await getR2DownloadUrl(file.r2Key);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err?.message || 'Download-URL konnte nicht generiert werden.'
      });
    }
  };

  // Preview handler
  const handleOpenPreview = async (file: StorageFile) => {
    setPreviewFile(file);
    setIsLoadingPreviewUrl(true);
    setPreviewUrl(null);
    try {
      const url = await getR2DownloadUrl(file.r2Key);
      setPreviewUrl(url);
    } catch (err) {
      console.error('Preview error:', err);
    } finally {
      setIsLoadingPreviewUrl(false);
    }
  };

  // Kahoot AI Integration Action
  const handleCreateKahootFromMaterial = async (file: StorageFile) => {
    try {
      const url = await getR2DownloadUrl(file.r2Key);
      if (onOpenInKahoot) {
        onOpenInKahoot(file, url);
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: 'Konnte Datei nicht für Kahoot vorbereiten.'
      });
    }
  };

  // Blackboard Integration Action
  const handleDisplayOnBoard = async (file: StorageFile) => {
    try {
      const url = await getR2DownloadUrl(file.r2Key);
      if (onOpenInBoard) {
        onOpenInBoard(file, url);
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: 'Konnte Datei nicht für Tafel vorbereiten.'
      });
    }
  };

  // Promptbaukasten Integration Action
  const handleOpenInUnterrichtsbaukasten = async (file: StorageFile) => {
    try {
      const url = await getR2DownloadUrl(file.r2Key);
      // Construct deep link with signed URL and metadata
      const baukastenUrl = `https://promptbaukasten.vercel.app/?materialUrl=${encodeURIComponent(url)}&fileName=${encodeURIComponent(file.name)}&subject=${encodeURIComponent(file.subject || '')}`;
      window.open(baukastenUrl, '_blank');
      setNotification({
        type: 'success',
        message: `Unterrichtsbaukasten mit „${file.name}“ geöffnet!`
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: 'Konnte Link für Unterrichtsbaukasten nicht erzeugen.'
      });
    }
  };

  // Share toggle (move between private and shared)
  const handleToggleShare = async (file: StorageFile) => {
    try {
      const newSharedState = !file.isShared;
      await updateStorageFileRecord(file.id, {
        isShared: newSharedState,
        folderId: null // Reset to root of that scope
      });
      setNotification({
        type: 'success',
        message: newSharedState
          ? `„${file.name}“ wurde in den Austauschbereich für alle freigegeben!`
          : `„${file.name}“ wurde in Ihren persönlichen Bereich verschoben.`
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: 'Freigabestatus konnte nicht geändert werden.'
      });
    }
  };

  // Delete execution
  const executeDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'file') {
        if (deleteTarget.r2Key) {
          await deleteFileFromR2(deleteTarget.r2Key);
        }
        await deleteStorageFileRecord(deleteTarget.id);
        setNotification({ type: 'success', message: `„${deleteTarget.name}“ gelöscht.` });
      } else {
        await deleteStorageFolder(deleteTarget.id);
        setNotification({ type: 'success', message: `Ordner „${deleteTarget.name}“ gelöscht.` });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err?.message || 'Löschen fehlgeschlagen.' });
    } finally {
      setDeleteTarget(null);
    }
  };

  // Rename execution
  const executeRename = async (newName: string) => {
    if (!renameTarget || !newName.trim()) return;
    try {
      if (renameTarget.type === 'file') {
        await updateStorageFileRecord(renameTarget.id, { name: newName.trim() });
      } else {
        await updateStorageFolder(renameTarget.id, { name: newName.trim() });
      }
      setNotification({ type: 'success', message: 'Erfolgreich umbenannt.' });
    } catch (err: any) {
      setNotification({ type: 'error', message: 'Umbenennen fehlgeschlagen.' });
    } finally {
      setRenameTarget(null);
    }
  };

  // Icon helper based on file extension
  const renderFileIcon = (ext: string) => {
    const e = ext.toLowerCase();
    if (e === 'pdf') {
      return (
        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200 font-black text-xs">
          PDF
        </div>
      );
    }
    if (['doc', 'docx', 'odt', 'txt', 'md'].includes(e)) {
      return (
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
          <FileText className="w-5 h-5" />
        </div>
      );
    }
    if (['ppt', 'pptx', 'odp'].includes(e)) {
      return (
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200 font-black text-xs">
          PPT
        </div>
      );
    }
    if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(e)) {
      return (
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
          <FileImage className="w-5 h-5" />
        </div>
      );
    }
    if (['mp3', 'm4a', 'wav'].includes(e)) {
      return (
        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200">
          <FileAudio className="w-5 h-5" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200">
        <File className="w-5 h-5" />
      </div>
    );
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100 text-hbs-slate-dark relative pb-24"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFileUpload(e.target.files);
          e.target.value = '';
        }}
      />

      {/* Drag & Drop Visual Overlay */}
      {isDragOver && (
        <div className="fixed inset-0 z-50 bg-hbs-blue/80 backdrop-blur-sm flex flex-col items-center justify-center text-white pointer-events-none animate-fadeIn">
          <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center mb-4 animate-bounce">
            <Upload className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-black">Dateien hier ablegen</h2>
          <p className="text-sm font-medium opacity-90 mt-1">
            Wird direkt in Cloudflare R2 gespeichert ({isSharedScope ? 'Austauschbereich' : 'Mein Speicher'})
          </p>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div 
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border text-sm font-bold flex items-center gap-2.5 animate-slideDown ${
            notification.type === 'success' 
              ? 'bg-emerald-600 text-white border-emerald-500' 
              : 'bg-rose-600 text-white border-rose-500'
          }`}
        >
          {notification.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* TOP HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-xs px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Back & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToPortal}
              className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 text-hbs-slate-dark flex items-center justify-center transition-all duration-150 active:scale-95 shadow-xs"
              title="Zurück zum Portal"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-hbs-slate-dark tracking-tight">
                  Dateiablage & Materialpool
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-hbs-blue text-[10px] font-black uppercase tracking-wider">
                  Cloudflare R2
                </span>
              </div>
              <p className="text-xs text-hbs-slate-muted hidden md:block">
                Sicherer, unbegrenzter Schulspeicher mit 0 € Transferkosten & App-Verknüpfung
              </p>
            </div>
          </div>

          {/* Scope Selector Tabs (Mein Bereich vs. Austausch) */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80">
            <button
              onClick={() => {
                setActiveScope('personal');
                setCurrentFolderId(null);
              }}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition-all duration-150 flex items-center gap-2 ${
                activeScope === 'personal'
                  ? 'bg-white text-hbs-blue shadow-xs scale-102'
                  : 'text-hbs-slate-muted hover:text-hbs-slate-dark'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-hbs-blue" />
              <span>Mein Speicher</span>
            </button>

            <button
              onClick={() => {
                setActiveScope('shared');
                setCurrentFolderId(null);
              }}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition-all duration-150 flex items-center gap-2 ${
                activeScope === 'shared'
                  ? 'bg-white text-purple-600 shadow-xs scale-102'
                  : 'text-hbs-slate-muted hover:text-hbs-slate-dark'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-purple-600" />
              <span>Kollegiums-Austausch</span>
            </button>
          </div>

          {/* Upload & New Folder Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsNewFolderOpen(true)}
              className="px-3 sm:px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-hbs-slate-dark text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 border border-slate-200"
              title="Neuen Ordner anlegen"
            >
              <FolderPlus className="w-4 h-4 text-hbs-blue" />
              <span className="hidden sm:inline">Neuer Ordner</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-xs font-black shadow-md flex items-center gap-1.5 transition-all active:scale-95"
              title="Dateien hochladen"
            >
              <Upload className="w-4 h-4" />
              <span>Hochladen</span>
            </button>
          </div>

        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">

        {/* Quota & Quick Info Bar */}
        <div className="mb-6 p-4 rounded-3xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-10 h-10 rounded-2xl bg-hbs-blue-soft text-hbs-blue flex items-center justify-center shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-hbs-slate-dark">
                  Cloudflare R2 Freikontingent: {quotaInfo.formattedUsed} von {quotaInfo.formattedTotal} belegt
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  {quotaInfo.percentUsed}% genutzt
                </span>
              </div>
              <div className="w-48 sm:w-64 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-hbs-blue to-teal-500 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.max(4, quotaInfo.percentUsed)}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Search & Layout Toggle */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Dateien durchsuchen..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-hbs-blue text-xs font-bold text-hbs-slate-dark placeholder-slate-400 bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Fach-Filter */}
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-hbs-slate-dark bg-white focus:outline-none focus:ring-2 focus:ring-hbs-blue hidden sm:block"
            >
              <option value="all">Alle Fächer</option>
              <option value="Mathematik">Mathematik</option>
              <option value="Deutsch">Deutsch</option>
              <option value="Englisch">Englisch</option>
              <option value="Biologie">Biologie</option>
              <option value="Physik">Physik</option>
              <option value="Geschichte">Geschichte</option>
              <option value="Allgemein">Allgemein</option>
            </select>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewLayout('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewLayout === 'grid' ? 'bg-white text-hbs-blue shadow-xs' : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Kachelansicht"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewLayout('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewLayout === 'table' ? 'bg-white text-hbs-blue shadow-xs' : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Listenansicht"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Uploads Indicator */}
        {activeUploads.length > 0 && (
          <div className="mb-6 space-y-2">
            {activeUploads.map((upl) => (
              <div 
                key={upl.id}
                className="p-3 rounded-2xl bg-hbs-blue-soft border border-hbs-blue/30 flex items-center justify-between gap-4 animate-fadeIn"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <RefreshCw className="w-4 h-4 text-hbs-blue animate-spin shrink-0" />
                  <span className="text-xs font-bold text-hbs-blue truncate">
                    Wird zu Cloudflare hochgeladen: {upl.name}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-24 h-2 bg-white/60 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-hbs-blue rounded-full transition-all"
                      style={{ width: `${upl.progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-black text-hbs-blue w-9 text-right">
                    {upl.progress}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* BREADCRUMB NAVIGATION */}
        <div className="mb-6 flex items-center gap-1.5 text-xs font-bold text-hbs-slate-muted flex-wrap">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.id || 'root'}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
                <button
                  onClick={() => setCurrentFolderId(crumb.id)}
                  disabled={isLast}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    isLast 
                      ? 'text-hbs-slate-dark font-black bg-white shadow-xs border border-slate-200' 
                      : 'hover:text-hbs-blue hover:bg-slate-100'
                  }`}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* 1. SECTION: FOLDERS */}
        {visibleFolders.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xs font-black uppercase tracking-wider text-hbs-slate-muted mb-3 flex items-center gap-2">
              <FolderOpen className="w-3.5 h-3.5 text-hbs-blue" />
              <span>Ordner ({visibleFolders.length})</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {visibleFolders.map((folder) => {
                const childFileCount = files.filter((f) => f.folderId === folder.id).length;
                return (
                  <div
                    key={folder.id}
                    onClick={() => setCurrentFolderId(folder.id)}
                    className="group relative p-4 rounded-2xl bg-white hover:bg-blue-50/50 border border-slate-200/80 hover:border-hbs-blue/40 shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 group-hover:bg-amber-100 text-amber-500 flex items-center justify-center transition-all">
                        <Folder className="w-5 h-5 fill-amber-500 text-amber-600" />
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenameTarget({ id: folder.id, type: 'folder', name: folder.name });
                          }}
                          className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                          title="Umbenennen"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget({ id: folder.id, type: 'folder', name: folder.name });
                          }}
                          className="p-1 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                          title="Löschen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-hbs-slate-dark group-hover:text-hbs-blue truncate">
                        {folder.name}
                      </h4>
                      <p className="text-[11px] text-hbs-slate-muted mt-0.5">
                        {childFileCount} {childFileCount === 1 ? 'Datei' : 'Dateien'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. SECTION: FILES */}
        <div>
          <div className="flex items-center justify-between gap-4 mb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-hbs-slate-muted flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-hbs-blue" />
              <span>Dateien ({visibleFiles.length})</span>
            </h3>

            {visibleFiles.length > 0 && (
              <span className="text-[11px] text-hbs-slate-muted">
                Tipp: Mit ⚡ direkt als Quiz für den Kahoot-Nachbau nutzen
              </span>
            )}
          </div>

          {visibleFiles.length === 0 ? (
            <div className="p-10 rounded-3xl bg-white/70 border border-dashed border-slate-300 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                <Upload className="w-8 h-8" />
              </div>
              <h4 className="text-base font-black text-hbs-slate-dark">
                Noch keine Dateien in diesem Verzeichnis
              </h4>
              <p className="text-xs text-hbs-slate-muted mt-1 max-w-sm leading-relaxed">
                Ziehen Sie Arbeitsblätter, PDFs oder Unterrichtsmaterialien einfach per Drag & Drop hierher oder klicken Sie auf „Hochladen“.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 px-4 py-2 rounded-xl bg-hbs-blue text-white text-xs font-black shadow-xs hover:bg-hbs-blue-deep transition-all active:scale-95"
              >
                Erste Datei hochladen
              </button>
            </div>
          ) : viewLayout === 'grid' ? (
            /* GRID VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {visibleFiles.map((file) => (
                <div
                  key={file.id}
                  className="group relative p-4 rounded-3xl bg-white border border-slate-200/80 hover:border-hbs-blue/40 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                >
                  {/* Top Header of Card */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      {renderFileIcon(file.fileExtension)}
                      
                      {/* Badge: Shared vs Personal */}
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        file.isShared 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-blue-100 text-hbs-blue'
                      }`}>
                        {file.isShared ? 'Austausch' : 'Mein'}
                      </span>
                    </div>

                    <h4 
                      onClick={() => handleOpenPreview(file)}
                      className="text-sm font-black text-hbs-slate-dark group-hover:text-hbs-blue cursor-pointer truncate transition-colors"
                      title={file.name}
                    >
                      {file.name}
                    </h4>

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-hbs-slate-muted">
                      <span>{formatFileSize(file.fileSize)}</span>
                      <span>•</span>
                      <span>{file.ownerName}</span>
                    </div>
                  </div>

                  {/* Quick Action Dock on File Card */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1">
                    
                    <div className="flex items-center gap-1">
                      {/* Preview Button */}
                      <button
                        onClick={() => handleOpenPreview(file)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-hbs-blue transition-all"
                        title="Vorschau / Öffnen"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Download Button */}
                      <button
                        onClick={() => handleDownload(file)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-hbs-blue transition-all"
                        title="Herunterladen"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {/* Direct to Kahoot AI Generator */}
                      {onOpenInKahoot && (
                        <button
                          onClick={() => handleCreateKahootFromMaterial(file)}
                          className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-600 transition-all active:scale-95"
                          title="Als Kahoot-Quiz erstellen"
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>
                      )}

                      {/* Direct to Unterrichtsbaukasten */}
                      <button
                        onClick={() => handleOpenInUnterrichtsbaukasten(file)}
                        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-hbs-blue transition-all active:scale-95"
                        title="Im Unterrichtsbaukasten nutzen"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>

                      {/* Direct to Blackboard */}
                      {onOpenInBoard && ['pdf', 'png', 'jpg', 'jpeg'].includes(file.fileExtension.toLowerCase()) && (
                        <button
                          onClick={() => handleDisplayOnBoard(file)}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-all active:scale-95"
                          title="Auf der Schultafel anzeigen"
                        >
                          <Presentation className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Share toggle */}
                      <button
                        onClick={() => handleToggleShare(file)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-purple-600 transition-all"
                        title={file.isShared ? 'Zurück in persönlichen Bereich' : 'In Austauschbereich teilen'}
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => setDeleteTarget({ id: file.id, type: 'file', name: file.name, r2Key: file.r2Key })}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all"
                        title="Löschen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* TABLE / LIST VIEW */
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-hbs-slate-muted font-black uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4 hidden sm:table-cell">Größe</th>
                    <th className="py-3 px-4 hidden md:table-cell">Erstellt von</th>
                    <th className="py-3 px-4 hidden lg:table-cell">Datum</th>
                    <th className="py-3 px-4 text-right">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold">
                  {visibleFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div 
                          onClick={() => handleOpenPreview(file)}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          {renderFileIcon(file.fileExtension)}
                          <div>
                            <p className="text-sm font-black text-hbs-slate-dark group-hover:text-hbs-blue truncate max-w-xs sm:max-w-md">
                              {file.name}
                            </p>
                            <span className="sm:hidden text-[10px] text-hbs-slate-muted">
                              {formatFileSize(file.fileSize)} • {file.ownerName}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-hbs-slate-muted hidden sm:table-cell">
                        {formatFileSize(file.fileSize)}
                      </td>
                      <td className="py-3 px-4 text-hbs-slate-muted hidden md:table-cell">
                        {file.ownerName}
                      </td>
                      <td className="py-3 px-4 text-hbs-slate-muted hidden lg:table-cell">
                        {formatDate(file.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenPreview(file)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-hbs-blue"
                            title="Vorschau"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(file)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-hbs-blue"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          {onOpenInKahoot && (
                            <button
                              onClick={() => handleCreateKahootFromMaterial(file)}
                              className="p-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100"
                              title="Als Kahoot-Quiz"
                            >
                              <Sparkles className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenInUnterrichtsbaukasten(file)}
                            className="p-1.5 rounded-lg bg-blue-50 text-hbs-blue hover:bg-blue-100"
                            title="Im Baukasten"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ id: file.id, type: 'file', name: file.name, r2Key: file.r2Key })}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                            title="Löschen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* MODAL: New Folder */}
      <NewFolderModal
        isOpen={isNewFolderOpen}
        onClose={() => setIsNewFolderOpen(false)}
        isShared={isSharedScope}
        onCreateFolder={async (name, color, subject) => {
          await createStorageFolder({
            name,
            parentId: currentFolderId,
            isShared: isSharedScope,
            ownerId: currentUser?.id || 'guest',
            ownerName: currentUser?.name || 'Kollege',
            color,
            subject
          });
          setNotification({ type: 'success', message: `Ordner „${name}“ angelegt.` });
        }}
      />

      {/* MODAL: File Preview */}
      <FilePreviewModal
        file={previewFile}
        downloadUrl={previewUrl}
        isLoadingUrl={isLoadingPreviewUrl}
        onClose={() => setPreviewFile(null)}
        onOpenInKahoot={onOpenInKahoot}
        onOpenInBoard={onOpenInBoard}
      />

      {/* MODAL: Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-hbs-slate-dark">
              {deleteTarget.type === 'file' ? 'Datei löschen?' : 'Ordner löschen?'}
            </h3>
            <p className="text-xs text-hbs-slate-muted mt-1 leading-relaxed">
              Möchten Sie „{deleteTarget.name}“ wirklich unwiderruflich aus Cloudflare R2 und der Ablage entfernen?
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
              >
                Abbrechen
              </button>
              <button
                onClick={executeDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md transition-all active:scale-95"
              >
                Endgültig löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Rename Item */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-hbs-slate-dark mb-3">
              Umbenennen
            </h3>
            <input
              type="text"
              defaultValue={renameTarget.name}
              id="rename-input"
              autoFocus
              className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-hbs-slate-dark focus:outline-none focus:ring-2 focus:ring-hbs-blue"
            />
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setRenameTarget(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  const val = (document.getElementById('rename-input') as HTMLInputElement)?.value;
                  if (val) executeRename(val);
                }}
                className="px-4 py-2 rounded-xl bg-hbs-blue text-white text-xs font-black shadow-md"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
