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
  FolderOpen,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FolderInput,
  Copy,
  Scissors,
  ClipboardPaste,
  GripVertical
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatTeacherName } from '../../types/user';
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

type StorageSortKey = 'name' | 'type' | 'size' | 'owner' | 'date';
type StorageSortDirection = 'asc' | 'desc';

interface StorageDragItem {
  type: 'file' | 'folder';
  id: string;
  name: string;
}

interface StorageClipboardItem {
  mode: 'copy' | 'cut';
  type: 'file' | 'folder';
  id: string;
  name: string;
  sourceScope: StorageScope;
}

const STORAGE_LAYOUT_KEY = 'hbs_storage_view_layout_v1';
const STORAGE_SORT_KEY = 'hbs_storage_sort_key_v1';
const STORAGE_SORT_DIR_KEY = 'hbs_storage_sort_dir_v1';
const STORAGE_FOLDERS_FIRST_KEY = 'hbs_storage_folders_first_v1';

const germanCollator = new Intl.Collator('de', { numeric: true, sensitivity: 'base' });

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
  const [viewLayout, setViewLayout] = useState<StorageViewLayout>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LAYOUT_KEY);
      if (saved === 'grid' || saved === 'table') return saved;
    } catch {}
    return 'grid';
  });
  const [sortKey, setSortKey] = useState<StorageSortKey>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SORT_KEY) as StorageSortKey | null;
      if (saved && ['name', 'type', 'size', 'owner', 'date'].includes(saved)) return saved;
    } catch {}
    return 'name';
  });
  const [sortDirection, setSortDirection] = useState<StorageSortDirection>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SORT_DIR_KEY);
      if (saved === 'asc' || saved === 'desc') return saved;
    } catch {}
    return 'asc';
  });
  const [foldersFirst, setFoldersFirst] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_FOLDERS_FIRST_KEY);
      if (saved !== null) return saved === 'true';
    } catch {}
    return true;
  });
  const [sortAnnouncement, setSortAnnouncement] = useState<string>('');
  const [draggedItem, setDraggedItem] = useState<StorageDragItem | null>(null);
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<StorageClipboardItem | null>(null);
  const [isPasting, setIsPasting] = useState<boolean>(false);

  // Modals & Overlays
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<StorageFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreviewUrl, setIsLoadingPreviewUrl] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeUploads, setActiveUploads] = useState<{ id: string; name: string; progress: number }[]>([]);
  const [renameTarget, setRenameTarget] = useState<{ id: string; type: 'folder' | 'file'; name: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'folder' | 'file'; name: string; r2Key?: string } | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string; actionLabel?: string; onAction?: () => void } | null>(null);

  // Persist Finder layout & sort settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_LAYOUT_KEY, viewLayout);
      localStorage.setItem(STORAGE_SORT_KEY, sortKey);
      localStorage.setItem(STORAGE_SORT_DIR_KEY, sortDirection);
      localStorage.setItem(STORAGE_FOLDERS_FIRST_KEY, String(foldersFirst));
    } catch {}
  }, [viewLayout, sortKey, sortDirection, foldersFirst]);

  // Auto-hide notifications
  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(t);
  }, [notification]);

  // Escape clears clipboard when no modal is open
  useEffect(() => {
    if (!clipboard) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isNewFolderOpen && !previewFile && !renameTarget && !deleteTarget) {
        setClipboard(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [clipboard, isNewFolderOpen, previewFile, renameTarget, deleteTarget]);

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
  const currentOwnerId = currentUser?.id || 'guest';
  const currentOwnerName = currentUser ? formatTeacherName(currentUser) : 'Kollege';

  const currentFolder = useMemo(() => {
    if (!currentFolderId) return null;
    return folders.find((f) => f.id === currentFolderId) || null;
  }, [folders, currentFolderId]);

  // Recursive folder stats (counts files & bytes across all nested subfolders)
  const folderStatsMap = useMemo(() => {
    const map = new Map<string, { fileCount: number; subFolderCount: number; totalBytes: number }>();

    const computeStats = (
      folderId: string,
      visited: Set<string> = new Set()
    ): { fileCount: number; subFolderCount: number; totalBytes: number } => {
      if (map.has(folderId)) return map.get(folderId)!;
      if (visited.has(folderId)) return { fileCount: 0, subFolderCount: 0, totalBytes: 0 };
      visited.add(folderId);

      const directFiles = files.filter((f) => {
        if (f.folderId !== folderId) return false;
        return isSharedScope ? f.isShared : (!f.isShared && f.ownerId === currentOwnerId);
      });

      const directSubFolders = folders.filter((sub) => {
        if (sub.parentId !== folderId) return false;
        return isSharedScope ? sub.isShared : (!sub.isShared && sub.ownerId === currentOwnerId);
      });

      let fileCount = directFiles.length;
      let subFolderCount = directSubFolders.length;
      let totalBytes = directFiles.reduce((acc, f) => acc + (f.fileSize || 0), 0);

      for (const sub of directSubFolders) {
        const subStats = computeStats(sub.id, visited);
        fileCount += subStats.fileCount;
        subFolderCount += subStats.subFolderCount;
        totalBytes += subStats.totalBytes;
      }

      const result = { fileCount, subFolderCount, totalBytes };
      map.set(folderId, result);
      return result;
    };

    for (const folder of folders) {
      const matchesScope = isSharedScope ? folder.isShared : (!folder.isShared && folder.ownerId === currentOwnerId);
      if (matchesScope) {
        computeStats(folder.id);
      }
    }
    return map;
  }, [folders, files, isSharedScope, currentOwnerId]);

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

  const handleSortColumn = (key: StorageSortKey) => {
    const nextDir: StorageSortDirection =
      sortKey === key ? (sortDirection === 'asc' ? 'desc' : 'asc') : 'asc';
    setSortKey(key);
    setSortDirection(nextDir);
    const labelMap: Record<StorageSortKey, string> = {
      name: 'Name',
      type: 'Typ / Fach',
      size: 'Größe',
      owner: 'Erstellt von',
      date: 'Datum'
    };
    setSortAnnouncement(
      `Sortiert nach ${labelMap[key]}, ${nextDir === 'asc' ? 'aufsteigend' : 'absteigend'}`
    );
  };

  // Filter & sort folders for current view
  const visibleFolders = useMemo(() => {
    const filtered = folders.filter((folder) => {
      const matchesScope = isSharedScope
        ? folder.isShared
        : (!folder.isShared && folder.ownerId === currentOwnerId);
      if (!matchesScope) return false;
      if (searchQuery.trim()) {
        return folder.name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return folder.parentId === currentFolderId;
    });

    const factor = sortDirection === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'name':
          return factor * germanCollator.compare(a.name, b.name);
        case 'type':
          return factor * germanCollator.compare(a.subject || 'Ordner', b.subject || 'Ordner');
        case 'size': {
          const sizeA = folderStatsMap.get(a.id)?.totalBytes || 0;
          const sizeB = folderStatsMap.get(b.id)?.totalBytes || 0;
          return factor * (sizeA - sizeB) || germanCollator.compare(a.name, b.name);
        }
        case 'owner':
          return factor * germanCollator.compare(a.ownerName || '', b.ownerName || '');
        case 'date': {
          const dateA = a.updatedAt || a.createdAt || 0;
          const dateB = b.updatedAt || b.createdAt || 0;
          return factor * (dateA - dateB);
        }
      }
    });
  }, [folders, isSharedScope, currentFolderId, searchQuery, currentOwnerId, sortKey, sortDirection, folderStatsMap]);

  // Filter & sort files for current view
  const visibleFiles = useMemo(() => {
    const filtered = files.filter((file) => {
      const matchesScope = isSharedScope
        ? file.isShared
        : (!file.isShared && file.ownerId === currentOwnerId);
      if (!matchesScope) return false;

      if (subjectFilter !== 'all' && file.subject !== subjectFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          file.name.toLowerCase().includes(q) ||
          file.ownerName.toLowerCase().includes(q) ||
          (file.subject && file.subject.toLowerCase().includes(q))
        );
      }

      return file.folderId === currentFolderId;
    });

    const factor = sortDirection === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'name':
          return factor * germanCollator.compare(a.name, b.name);
        case 'type': {
          const typeA = `${a.fileExtension || ''} ${a.subject || ''}`.trim();
          const typeB = `${b.fileExtension || ''} ${b.subject || ''}`.trim();
          return factor * germanCollator.compare(typeA, typeB) || germanCollator.compare(a.name, b.name);
        }
        case 'size':
          return factor * ((a.fileSize || 0) - (b.fileSize || 0)) || germanCollator.compare(a.name, b.name);
        case 'owner':
          return factor * germanCollator.compare(a.ownerName || '', b.ownerName || '');
        case 'date': {
          const dateA = a.updatedAt || a.createdAt || 0;
          const dateB = b.updatedAt || b.createdAt || 0;
          return factor * (dateA - dateB);
        }
      }
    });
  }, [files, isSharedScope, currentFolderId, searchQuery, subjectFilter, currentOwnerId, sortKey, sortDirection]);

  // Combined Finder/Explorer list rows (either folders-first or mixed sorted together)
  const finderListRows = useMemo(() => {
    type ListRow =
      | { kind: 'folder'; id: string; folder: StorageFolder; stats: { fileCount: number; subFolderCount: number; totalBytes: number } }
      | { kind: 'file'; id: string; file: StorageFile };

    const folderRows: ListRow[] = visibleFolders.map((folder) => ({
      kind: 'folder',
      id: `folder:${folder.id}`,
      folder,
      stats: folderStatsMap.get(folder.id) || { fileCount: 0, subFolderCount: 0, totalBytes: 0 }
    }));

    const fileRows: ListRow[] = visibleFiles.map((file) => ({
      kind: 'file',
      id: `file:${file.id}`,
      file
    }));

    if (foldersFirst) {
      return [...folderRows, ...fileRows];
    }

    const factor = sortDirection === 'asc' ? 1 : -1;
    return [...folderRows, ...fileRows].sort((a, b) => {
      const nameA = a.kind === 'folder' ? a.folder.name : a.file.name;
      const nameB = b.kind === 'folder' ? b.folder.name : b.file.name;
      switch (sortKey) {
        case 'name':
          return factor * germanCollator.compare(nameA, nameB);
        case 'type': {
          const tA = a.kind === 'folder' ? `Ordner ${a.folder.subject || ''}` : `${a.file.fileExtension} ${a.file.subject || ''}`;
          const tB = b.kind === 'folder' ? `Ordner ${b.folder.subject || ''}` : `${b.file.fileExtension} ${b.file.subject || ''}`;
          return factor * germanCollator.compare(tA, tB) || germanCollator.compare(nameA, nameB);
        }
        case 'size': {
          const sA = a.kind === 'folder' ? a.stats.totalBytes : a.file.fileSize || 0;
          const sB = b.kind === 'folder' ? b.stats.totalBytes : b.file.fileSize || 0;
          return factor * (sA - sB) || germanCollator.compare(nameA, nameB);
        }
        case 'owner': {
          const oA = a.kind === 'folder' ? a.folder.ownerName : a.file.ownerName;
          const oB = b.kind === 'folder' ? b.folder.ownerName : b.file.ownerName;
          return factor * germanCollator.compare(oA || '', oB || '');
        }
        case 'date': {
          const dA = a.kind === 'folder' ? (a.folder.updatedAt || a.folder.createdAt) : (a.file.updatedAt || a.file.createdAt);
          const dB = b.kind === 'folder' ? (b.folder.updatedAt || b.folder.createdAt) : (b.file.updatedAt || b.file.createdAt);
          return factor * ((dA || 0) - (dB || 0));
        }
      }
    });
  }, [visibleFolders, visibleFiles, folderStatsMap, foldersFirst, sortKey, sortDirection]);

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
          ownerName: currentUser ? formatTeacherName(currentUser) : 'Kollege',
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

  // External file upload drag & drop handlers (ignored while dragging internal items)
  const isExternalFileDrag = (e: React.DragEvent) =>
    !draggedItem && Array.from(e.dataTransfer?.types || []).includes('Files');

  const handleDragOver = (e: React.DragEvent) => {
    if (!isExternalFileDrag(e)) return;
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!isExternalFileDrag(e)) return;
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isExternalFileDrag(e)) return;
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  // Cycle check: prevents moving/copying a folder into itself or any descendant folder
  const isDescendantOrSelfFolder = (sourceFolderId: string, targetFolderId: string | null): boolean => {
    if (!targetFolderId) return false;
    let cursor: string | null = targetFolderId;
    const visited = new Set<string>();
    while (cursor) {
      if (cursor === sourceFolderId) return true;
      if (visited.has(cursor)) break;
      visited.add(cursor);
      const found = folders.find((f) => f.id === cursor);
      cursor = found?.parentId || null;
    }
    return false;
  };

  const buildCopyName = (originalName: string, existingNames: Set<string>, isFolder: boolean): string => {
    if (!existingNames.has(originalName.toLowerCase())) return originalName;
    const dotIdx = !isFolder ? originalName.lastIndexOf('.') : -1;
    const base = dotIdx > 0 ? originalName.slice(0, dotIdx) : originalName;
    const ext = dotIdx > 0 ? originalName.slice(dotIdx) : '';
    let candidate = `${base} (Kopie)${ext}`;
    let counter = 2;
    while (existingNames.has(candidate.toLowerCase())) {
      candidate = `${base} (Kopie ${counter})${ext}`;
      counter++;
    }
    return candidate;
  };

  const collectFolderSubtree = (rootFolderId: string) => {
    const subFolderIds: string[] = [];
    const queue = [rootFolderId];
    const visited = new Set<string>([rootFolderId]);
    while (queue.length > 0) {
      const currId = queue.shift()!;
      subFolderIds.push(currId);
      folders
        .filter((f) => f.parentId === currId)
        .forEach((child) => {
          if (!visited.has(child.id)) {
            visited.add(child.id);
            queue.push(child.id);
          }
        });
    }
    return subFolderIds;
  };

  const moveItemToTarget = async (
    item: { type: 'file' | 'folder'; id: string },
    targetScope: StorageScope,
    targetFolderId: string | null
  ): Promise<boolean> => {
    const targetShared = targetScope === 'shared';

    if (item.type === 'file') {
      const file = files.find((f) => f.id === item.id);
      if (!file) return false;
      if (file.folderId === targetFolderId && file.isShared === targetShared) {
        return false;
      }

      // Fremde Datei aus Austausch -> beim Ziehen/Verschieben nach Mein Speicher sicher kopieren statt für alle zu entfernen
      if (file.isShared && !targetShared && file.ownerId !== currentOwnerId) {
        await addStorageFileRecord({
          name: file.name,
          folderId: targetFolderId,
          isShared: false,
          ownerId: currentOwnerId,
          ownerName: currentOwnerName,
          r2Key: file.r2Key,
          fileSize: file.fileSize,
          mimeType: file.mimeType,
          fileExtension: file.fileExtension,
          subject: file.subject,
          grade: file.grade,
          description: file.description,
          tags: file.tags
        });
        setNotification({
          type: 'success',
          message: `„${file.name}“ in Ihren persönlichen Bereich übernommen.`
        });
        return true;
      }

      await updateStorageFileRecord(file.id, {
        folderId: targetFolderId,
        isShared: targetShared,
        ...(targetShared ? {} : { ownerId: currentOwnerId, ownerName: currentOwnerName })
      });
      setNotification({
        type: 'success',
        message: `„${file.name}“ verschoben.`
      });
      return true;
    }

    const folder = folders.find((f) => f.id === item.id);
    if (!folder) return false;
    if (isDescendantOrSelfFolder(folder.id, targetFolderId)) {
      setNotification({
        type: 'error',
        message: 'Ein Ordner kann nicht in sich selbst oder einen Unterordner verschoben werden.'
      });
      return false;
    }
    if (folder.parentId === targetFolderId && folder.isShared === targetShared) {
      return false;
    }

    await updateStorageFolder(folder.id, {
      parentId: targetFolderId,
      isShared: targetShared,
      ...(!targetShared ? { ownerId: currentOwnerId, ownerName: currentOwnerName } : {})
    });

    if (folder.isShared !== targetShared) {
      const subtreeIds = collectFolderSubtree(folder.id);
      const childFolderIds = subtreeIds.filter((fid) => fid !== folder.id);
      const subtreeSet = new Set(subtreeIds);

      await Promise.all([
        ...childFolderIds.map((fid) =>
          updateStorageFolder(fid, {
            isShared: targetShared,
            ...(!targetShared ? { ownerId: currentOwnerId, ownerName: currentOwnerName } : {})
          })
        ),
        ...files
          .filter((f) => f.folderId && subtreeSet.has(f.folderId))
          .map((f) =>
            updateStorageFileRecord(f.id, {
              isShared: targetShared,
              ...(!targetShared ? { ownerId: currentOwnerId, ownerName: currentOwnerName } : {})
            })
          )
      ]);
    }

    setNotification({
      type: 'success',
      message: `Ordner „${folder.name}“ verschoben.`
    });
    return true;
  };

  const copyItemToTarget = async (
    item: { type: 'file' | 'folder'; id: string },
    targetScope: StorageScope,
    targetFolderId: string | null
  ): Promise<boolean> => {
    const targetShared = targetScope === 'shared';

    if (item.type === 'file') {
      const file = files.find((f) => f.id === item.id);
      if (!file) return false;

      const existingFileNames = new Set(
        files
          .filter((f) =>
            f.folderId === targetFolderId &&
            (targetShared ? f.isShared : (!f.isShared && f.ownerId === currentOwnerId))
          )
          .map((f) => f.name.toLowerCase())
      );

      const newName = buildCopyName(file.name, existingFileNames, false);
      await addStorageFileRecord({
        name: newName,
        folderId: targetFolderId,
        isShared: targetShared,
        ownerId: currentOwnerId,
        ownerName: currentOwnerName,
        r2Key: file.r2Key,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
        fileExtension: file.fileExtension,
        subject: file.subject,
        grade: file.grade,
        description: file.description,
        tags: file.tags
      });
      setNotification({
        type: 'success',
        message: `„${newName}“ hier eingefügt.`
      });
      return true;
    }

    const rootFolder = folders.find((f) => f.id === item.id);
    if (!rootFolder) return false;
    if (isDescendantOrSelfFolder(rootFolder.id, targetFolderId)) {
      setNotification({
        type: 'error',
        message: 'Ein Ordner kann nicht in sich selbst oder einen Unterordner kopiert werden.'
      });
      return false;
    }

    const existingFolderNames = new Set(
      folders
        .filter((f) =>
          f.parentId === targetFolderId &&
          (targetShared ? f.isShared : (!f.isShared && f.ownerId === currentOwnerId))
        )
        .map((f) => f.name.toLowerCase())
    );

    const cloneFolderRecursive = async (
      srcFolder: StorageFolder,
      destParentId: string | null,
      overrideName?: string,
      visited: Set<string> = new Set()
    ) => {
      if (visited.has(srcFolder.id)) return;
      visited.add(srcFolder.id);

      const created = await createStorageFolder({
        name: overrideName || srcFolder.name,
        parentId: destParentId,
        isShared: targetShared,
        ownerId: currentOwnerId,
        ownerName: currentOwnerName,
        color: srcFolder.color,
        subject: srcFolder.subject,
        grade: srcFolder.grade
      });

      const directFiles = files.filter((f) => f.folderId === srcFolder.id);
      for (const df of directFiles) {
        await addStorageFileRecord({
          name: df.name,
          folderId: created.id,
          isShared: targetShared,
          ownerId: currentOwnerId,
          ownerName: currentOwnerName,
          r2Key: df.r2Key,
          fileSize: df.fileSize,
          mimeType: df.mimeType,
          fileExtension: df.fileExtension,
          subject: df.subject,
          grade: df.grade,
          description: df.description,
          tags: df.tags
        });
      }

      const childFolders = folders.filter((cf) => cf.parentId === srcFolder.id);
      for (const cf of childFolders) {
        await cloneFolderRecursive(cf, created.id, undefined, visited);
      }
    };

    const topCopyName = buildCopyName(rootFolder.name, existingFolderNames, true);
    await cloneFolderRecursive(rootFolder, targetFolderId, topCopyName);
    setNotification({
      type: 'success',
      message: `Ordner „${topCopyName}“ inkl. Inhalt eingefügt.`
    });
    return true;
  };

  const handlePasteClipboard = async () => {
    if (!clipboard || isPasting) return;
    setIsPasting(true);
    try {
      if (clipboard.mode === 'cut') {
        const moved = await moveItemToTarget(
          { type: clipboard.type, id: clipboard.id },
          activeScope,
          currentFolderId
        );
        if (moved) {
          setClipboard(null);
        }
      } else {
        await copyItemToTarget(
          { type: clipboard.type, id: clipboard.id },
          activeScope,
          currentFolderId
        );
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err?.message || 'Einfügen fehlgeschlagen.'
      });
    } finally {
      setIsPasting(false);
    }
  };

  const handleInternalDragStart = (e: React.DragEvent, item: StorageDragItem) => {
    e.stopPropagation();
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('application/x-hbs-storage-item', JSON.stringify(item));
      e.dataTransfer.setData('text/plain', item.name);
    } catch {}
  };

  const handleInternalDragEnd = () => {
    setDraggedItem(null);
    setDropTargetKey(null);
  };

  const handleTargetDragOver = (e: React.DragEvent, targetKey: string, folderIdToCheck?: string | null) => {
    if (!draggedItem) return;
    if (draggedItem.type === 'folder' && folderIdToCheck && isDescendantOrSelfFolder(draggedItem.id, folderIdToCheck)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dropTargetKey !== targetKey) {
      setDropTargetKey(targetKey);
    }
  };

  const handleTargetDragLeave = (e: React.DragEvent, targetKey: string) => {
    if (!draggedItem) return;
    e.stopPropagation();
    if (dropTargetKey === targetKey) {
      setDropTargetKey(null);
    }
  };

  const handleDropOnTarget = async (
    e: React.DragEvent,
    targetScope: StorageScope,
    targetFolderId: string | null
  ) => {
    let payload: StorageDragItem | null = draggedItem;
    if (!payload) {
      try {
        const raw = e.dataTransfer.getData('application/x-hbs-storage-item');
        if (raw) payload = JSON.parse(raw);
      } catch {}
    }
    if (!payload) return;

    e.preventDefault();
    e.stopPropagation();
    setDraggedItem(null);
    setDropTargetKey(null);

    try {
      await moveItemToTarget({ type: payload.type, id: payload.id }, targetScope, targetFolderId);
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err?.message || 'Verschieben fehlgeschlagen.'
      });
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

  // Move / copy between personal storage and shared collegium area
  const handleToggleShare = async (file: StorageFile) => {
    try {
      if (file.isShared) {
        const isOwnFile = file.ownerId === currentOwnerId;
        if (isOwnFile) {
          await updateStorageFileRecord(file.id, {
            isShared: false,
            folderId: null,
            ownerId: currentOwnerId,
            ownerName: currentOwnerName
          });
          setNotification({
            type: 'success',
            message: `„${file.name}“ wurde in Ihren persönlichen Bereich verschoben.`,
            actionLabel: 'Zu Mein Speicher',
            onAction: () => {
              setActiveScope('personal');
              setCurrentFolderId(null);
              setNotification(null);
            }
          });
        } else {
          // Fremde/Admin-Datei aus dem Austausch -> Kopie unter eigener userId in Mein Speicher anlegen
          await addStorageFileRecord({
            name: file.name,
            folderId: null,
            isShared: false,
            ownerId: currentOwnerId,
            ownerName: currentOwnerName,
            r2Key: file.r2Key,
            fileSize: file.fileSize,
            mimeType: file.mimeType,
            fileExtension: file.fileExtension,
            subject: file.subject,
            grade: file.grade,
            description: file.description,
            tags: file.tags
          });
          setNotification({
            type: 'success',
            message: `„${file.name}“ in Ihren persönlichen Bereich übernommen (Original bleibt im Austausch).`,
            actionLabel: 'Zu Mein Speicher',
            onAction: () => {
              setActiveScope('personal');
              setCurrentFolderId(null);
              setNotification(null);
            }
          });
        }
      } else {
        await updateStorageFileRecord(file.id, {
          isShared: true,
          folderId: null,
          ownerId: currentOwnerId,
          ownerName: currentOwnerName
        });
        setNotification({
          type: 'success',
          message: `„${file.name}“ wurde in den Austauschbereich für alle freigegeben!`,
          actionLabel: 'Zum Austausch',
          onAction: () => {
            setActiveScope('shared');
            setCurrentFolderId(null);
            setNotification(null);
          }
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: 'Freigabestatus konnte nicht geändert werden.'
      });
    }
  };

  // Delete execution (protects shared R2 blobs if another metadata record still references the key)
  const executeDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'file') {
        const isR2KeyStillUsed = Boolean(
          deleteTarget.r2Key &&
          files.some((f) => f.id !== deleteTarget.id && f.r2Key === deleteTarget.r2Key)
        );
        if (deleteTarget.r2Key && !isR2KeyStillUsed) {
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
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border text-sm font-bold flex items-center gap-2.5 animate-slideDown max-w-md ${
            notification.type === 'success' 
              ? 'bg-emerald-600 text-white border-emerald-500' 
              : 'bg-rose-600 text-white border-rose-500'
          }`}
        >
          {notification.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span className="leading-snug">{notification.message}</span>
          {notification.actionLabel && notification.onAction && (
            <button
              type="button"
              onClick={notification.onAction}
              className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-black whitespace-nowrap transition-colors shrink-0"
            >
              {notification.actionLabel}
            </button>
          )}
          <button onClick={() => setNotification(null)} className="ml-1 hover:opacity-75 shrink-0" aria-label="Hinweis schließen">
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

          {/* Scope Selector Tabs (Mein Bereich vs. Austausch — also Drop Targets) */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80">
            <button
              onClick={() => {
                setActiveScope('personal');
                setCurrentFolderId(null);
              }}
              onDragOver={(e) => handleTargetDragOver(e, 'scope:personal')}
              onDragLeave={(e) => handleTargetDragLeave(e, 'scope:personal')}
              onDrop={(e) => handleDropOnTarget(e, 'personal', null)}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition-all duration-150 flex items-center gap-2 ${
                dropTargetKey === 'scope:personal'
                  ? 'bg-hbs-blue-soft text-hbs-blue ring-2 ring-hbs-blue scale-105'
                  : activeScope === 'personal'
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
              onDragOver={(e) => handleTargetDragOver(e, 'scope:shared')}
              onDragLeave={(e) => handleTargetDragLeave(e, 'scope:shared')}
              onDrop={(e) => handleDropOnTarget(e, 'shared', null)}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition-all duration-150 flex items-center gap-2 ${
                dropTargetKey === 'scope:shared'
                  ? 'bg-purple-50 text-purple-700 ring-2 ring-purple-500 scale-105'
                  : activeScope === 'shared'
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

          {/* Search, Filter, Sort & Layout Toggle */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <div className="relative flex-1 min-w-[180px] md:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Dateien durchsuchen..."
                className="w-full pl-9 pr-7 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-hbs-blue text-xs font-bold text-hbs-slate-dark placeholder-slate-400 bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Suche leeren"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Fach-Filter */}
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              aria-label="Nach Fach filtern"
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

            {/* Sortierung (auch in Kachelansicht nutzbar) */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-0.5">
              <select
                value={sortKey}
                onChange={(e) => {
                  const nextKey = e.target.value as StorageSortKey;
                  setSortKey(nextKey);
                  setSortAnnouncement(`Sortiert nach ${nextKey}`);
                }}
                aria-label="Sortierkriterium"
                className="px-2 py-1 text-xs font-bold text-hbs-slate-dark bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="name">Sortieren: Name</option>
                <option value="date">Sortieren: Datum</option>
                <option value="size">Sortieren: Größe</option>
                <option value="type">Sortieren: Typ / Fach</option>
                <option value="owner">Sortieren: Ersteller</option>
              </select>
              <button
                type="button"
                onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                title={sortDirection === 'asc' ? 'Aufsteigend (klicken für absteigend)' : 'Absteigend (klicken für aufsteigend)'}
                aria-label={sortDirection === 'asc' ? 'Sortierreihenfolge: aufsteigend' : 'Sortierreihenfolge: absteigend'}
              >
                {sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {viewLayout === 'table' && (
              <button
                type="button"
                onClick={() => setFoldersFirst((prev) => !prev)}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  foldersFirst
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                title="Ordner in der Listenansicht immer oben halten (wie im Finder)"
                aria-pressed={foldersFirst}
              >
                <Folder className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Ordner oben</span>
              </button>
            )}

            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewLayout('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewLayout === 'grid' ? 'bg-white text-hbs-blue shadow-xs' : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Kachelansicht"
                aria-label="Kachelansicht"
                aria-pressed={viewLayout === 'grid'}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewLayout === 'table' ? 'bg-white text-hbs-blue shadow-xs' : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Finder-Listenansicht mit Sortierung"
                aria-label="Finder-Listenansicht"
                aria-pressed={viewLayout === 'table'}
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

        {/* BREADCRUMB NAVIGATION (also Drop Targets for moving items up the hierarchy) */}
        <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold text-hbs-slate-muted flex-wrap">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              const crumbKey = `crumb:${crumb.id || 'root'}`;
              const isDropActive = dropTargetKey === crumbKey;
              return (
                <React.Fragment key={crumb.id || 'root'}>
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
                  <button
                    type="button"
                    onClick={() => {
                      if (!isLast) setCurrentFolderId(crumb.id);
                    }}
                    onDragOver={(e) => {
                      if (!isLast) handleTargetDragOver(e, crumbKey, crumb.id);
                    }}
                    onDragLeave={(e) => handleTargetDragLeave(e, crumbKey)}
                    onDrop={(e) => {
                      if (!isLast) handleDropOnTarget(e, activeScope, crumb.id);
                    }}
                    aria-current={isLast ? 'page' : undefined}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      isDropActive
                        ? 'bg-hbs-blue-soft text-hbs-blue ring-2 ring-hbs-blue scale-105'
                        : isLast
                          ? 'text-hbs-slate-dark font-black bg-white shadow-xs border border-slate-200 cursor-default'
                          : 'hover:text-hbs-blue hover:bg-slate-100 cursor-pointer'
                    }`}
                  >
                    {crumb.name}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          {draggedItem && (
            <div className="px-3 py-1 rounded-full bg-hbs-blue-soft border border-hbs-blue/30 text-hbs-blue text-[11px] font-bold flex items-center gap-1.5 animate-fadeIn">
              <GripVertical className="w-3.5 h-3.5" />
              <span>„{draggedItem.name}“ auf Ordner, Pfad oder Bereich ziehen</span>
            </div>
          )}
        </div>

        {/* CLIPBOARD BAR (Kopieren / Ausschneiden & Hier einfügen) */}
        {clipboard && (
          <div
            role="region"
            aria-label="Zwischenablage"
            className="mb-5 p-3 sm:px-4 rounded-2xl bg-white border-2 border-hbs-blue/30 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                clipboard.mode === 'cut'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-hbs-blue-soft text-hbs-blue'
              }`}>
                {clipboard.mode === 'cut' ? <Scissors className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-hbs-slate-dark truncate">
                  {clipboard.mode === 'cut' ? 'Ausgeschnitten:' : 'Kopiert:'}{' '}
                  <span className="text-hbs-blue">{clipboard.name}</span>
                </p>
                <p className="text-[11px] text-hbs-slate-muted">
                  Navigieren Sie zum Zielordner (oder wechseln Sie den Bereich) und klicken Sie auf „Hier einfügen“.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={handlePasteClipboard}
                disabled={isPasting}
                className="px-3.5 py-1.5 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-xs font-black shadow-xs flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-60"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>{isPasting ? 'Fügt ein…' : 'Hier einfügen'}</span>
              </button>
              <button
                type="button"
                onClick={() => setClipboard(null)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors"
                title="Zwischenablage leeren (Esc)"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {viewLayout === 'table' ? (
          /* UNIFIED FINDER / EXPLORER LIST VIEW (Folders + Files in one sortable table) */
          <div>
            <div role="status" className="sr-only">
              {sortAnnouncement}
            </div>

            {finderListRows.length === 0 ? (
              <div className="p-10 rounded-3xl bg-white/70 border border-dashed border-slate-300 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                  <Upload className="w-8 h-8" />
                </div>
                <h4 className="text-base font-black text-hbs-slate-dark">
                  Noch keine Ordner oder Dateien in diesem Verzeichnis
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
            ) : (
              <div
                role="region"
                aria-labelledby="finder-table-caption"
                tabIndex={0}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-x-auto focus:outline-none focus:ring-2 focus:ring-hbs-blue/30"
              >
                <table className="w-full min-w-[680px] text-left text-xs border-collapse">
                  <caption id="finder-table-caption" className="sr-only">
                    Dateien und Ordner im aktuellen Verzeichnis ({finderListRows.length} Einträge)
                  </caption>
                  <thead className="bg-slate-50 border-b border-slate-200 text-hbs-slate-muted font-black uppercase tracking-wider sticky top-0 z-10">
                    <tr>
                      <th
                        scope="col"
                        aria-sort={sortKey === 'name' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
                        className="p-0"
                      >
                        <button
                          type="button"
                          onClick={() => handleSortColumn('name')}
                          className="w-full py-3 px-4 flex items-center gap-1.5 text-left hover:text-hbs-blue hover:bg-slate-100/70 transition-colors focus-visible:outline-2 focus-visible:outline-hbs-blue"
                        >
                          <span>Name</span>
                          <span aria-hidden="true" className="text-slate-400">
                            {sortKey === 'name' ? (
                              sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-hbs-blue" /> : <ArrowDown className="w-3.5 h-3.5 text-hbs-blue" />
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                            )}
                          </span>
                        </button>
                      </th>
                      <th
                        scope="col"
                        aria-sort={sortKey === 'type' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
                        className="p-0 hidden sm:table-cell"
                      >
                        <button
                          type="button"
                          onClick={() => handleSortColumn('type')}
                          className="w-full py-3 px-4 flex items-center gap-1.5 text-left hover:text-hbs-blue hover:bg-slate-100/70 transition-colors focus-visible:outline-2 focus-visible:outline-hbs-blue"
                        >
                          <span>Typ / Fach</span>
                          <span aria-hidden="true" className="text-slate-400">
                            {sortKey === 'type' ? (
                              sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-hbs-blue" /> : <ArrowDown className="w-3.5 h-3.5 text-hbs-blue" />
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                            )}
                          </span>
                        </button>
                      </th>
                      <th
                        scope="col"
                        aria-sort={sortKey === 'size' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
                        className="p-0 hidden sm:table-cell"
                      >
                        <button
                          type="button"
                          onClick={() => handleSortColumn('size')}
                          className="w-full py-3 px-4 flex items-center gap-1.5 text-left hover:text-hbs-blue hover:bg-slate-100/70 transition-colors focus-visible:outline-2 focus-visible:outline-hbs-blue"
                        >
                          <span>Größe / Inhalt</span>
                          <span aria-hidden="true" className="text-slate-400">
                            {sortKey === 'size' ? (
                              sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-hbs-blue" /> : <ArrowDown className="w-3.5 h-3.5 text-hbs-blue" />
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                            )}
                          </span>
                        </button>
                      </th>
                      <th
                        scope="col"
                        aria-sort={sortKey === 'owner' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
                        className="p-0 hidden md:table-cell"
                      >
                        <button
                          type="button"
                          onClick={() => handleSortColumn('owner')}
                          className="w-full py-3 px-4 flex items-center gap-1.5 text-left hover:text-hbs-blue hover:bg-slate-100/70 transition-colors focus-visible:outline-2 focus-visible:outline-hbs-blue"
                        >
                          <span>Erstellt von</span>
                          <span aria-hidden="true" className="text-slate-400">
                            {sortKey === 'owner' ? (
                              sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-hbs-blue" /> : <ArrowDown className="w-3.5 h-3.5 text-hbs-blue" />
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                            )}
                          </span>
                        </button>
                      </th>
                      <th
                        scope="col"
                        aria-sort={sortKey === 'date' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
                        className="p-0 hidden lg:table-cell"
                      >
                        <button
                          type="button"
                          onClick={() => handleSortColumn('date')}
                          className="w-full py-3 px-4 flex items-center gap-1.5 text-left hover:text-hbs-blue hover:bg-slate-100/70 transition-colors focus-visible:outline-2 focus-visible:outline-hbs-blue"
                        >
                          <span>Geändert</span>
                          <span aria-hidden="true" className="text-slate-400">
                            {sortKey === 'date' ? (
                              sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-hbs-blue" /> : <ArrowDown className="w-3.5 h-3.5 text-hbs-blue" />
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                            )}
                          </span>
                        </button>
                      </th>
                      <th scope="col" className="py-3 px-4 text-right">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold">
                    {finderListRows.map((row) => {
                      if (row.kind === 'folder') {
                        const { folder, stats } = row;
                        const folderDropKey = `folder:${folder.id}`;
                        const isFolderDropTarget = dropTargetKey === folderDropKey;
                        const isCutFolder = clipboard?.mode === 'cut' && clipboard.type === 'folder' && clipboard.id === folder.id;
                        const isDraggedFolder = draggedItem?.type === 'folder' && draggedItem.id === folder.id;
                        return (
                          <tr
                            key={row.id}
                            draggable
                            onDragStart={(e) => handleInternalDragStart(e, { type: 'folder', id: folder.id, name: folder.name })}
                            onDragEnd={handleInternalDragEnd}
                            onDragOver={(e) => handleTargetDragOver(e, folderDropKey, folder.id)}
                            onDragLeave={(e) => handleTargetDragLeave(e, folderDropKey)}
                            onDrop={(e) => handleDropOnTarget(e, activeScope, folder.id)}
                            className={`transition-colors group ${
                              isFolderDropTarget
                                ? 'bg-hbs-blue-soft/80 ring-2 ring-inset ring-hbs-blue'
                                : 'hover:bg-amber-50/40'
                            } ${isCutFolder || isDraggedFolder ? 'opacity-50' : ''}`}
                          >
                            <td className="py-2.5 px-4">
                              <div className="flex items-center gap-2">
                                <span
                                  aria-hidden="true"
                                  title="Ziehen zum Verschieben"
                                  className="text-slate-300 group-hover:text-slate-500 cursor-grab active:cursor-grabbing shrink-0 select-none [-webkit-user-select:none]"
                                >
                                  <GripVertical className="w-3.5 h-3.5" />
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setCurrentFolderId(folder.id)}
                                  className="flex items-center gap-3 text-left flex-1 min-w-0 group-hover:text-hbs-blue focus-visible:outline-2 focus-visible:outline-hbs-blue rounded-lg"
                                >
                                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 border border-amber-200/70">
                                    <Folder className="w-4.5 h-4.5 fill-amber-500 text-amber-600" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-black text-hbs-slate-dark group-hover:text-hbs-blue truncate max-w-[200px] sm:max-w-md">
                                      {folder.name}
                                    </p>
                                    <span className="sm:hidden text-[10px] text-hbs-slate-muted block">
                                      Ordner • {stats.fileCount} {stats.fileCount === 1 ? 'Datei' : 'Dateien'}
                                      {stats.subFolderCount > 0 ? ` • ${stats.subFolderCount} Ordner` : ''}
                                    </span>
                                  </div>
                                </button>
                              </div>
                            </td>
                            <td className="py-2.5 px-4 text-hbs-slate-muted hidden sm:table-cell">
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/70 text-[10px] font-black">
                                Ordner{folder.subject ? ` • ${folder.subject}` : ''}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-hbs-slate-muted hidden sm:table-cell tabular-nums">
                              <span>
                                {stats.fileCount} {stats.fileCount === 1 ? 'Datei' : 'Dateien'}
                                {stats.subFolderCount > 0 ? ` (${stats.subFolderCount} Unterordner)` : ''}
                              </span>
                              {stats.totalBytes > 0 && (
                                <span className="block text-[10px] text-slate-400">
                                  {formatFileSize(stats.totalBytes)}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-hbs-slate-muted hidden md:table-cell">
                              {folder.ownerName}
                            </td>
                            <td className="py-2.5 px-4 text-hbs-slate-muted hidden lg:table-cell tabular-nums">
                              {formatDate(folder.updatedAt || folder.createdAt)}
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => setCurrentFolderId(folder.id)}
                                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-hbs-blue-soft text-slate-700 hover:text-hbs-blue text-[11px] font-bold transition-colors"
                                  title="Ordner öffnen"
                                >
                                  Öffnen
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setClipboard({ mode: 'copy', type: 'folder', id: folder.id, name: folder.name, sourceScope: activeScope })}
                                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-hbs-blue"
                                  title="Ordner kopieren"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setClipboard({ mode: 'cut', type: 'folder', id: folder.id, name: folder.name, sourceScope: activeScope })}
                                  className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-700"
                                  title="Ordner ausschneiden (Verschieben)"
                                >
                                  <Scissors className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRenameTarget({ id: folder.id, type: 'folder', name: folder.name })}
                                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                                  title="Ordner umbenennen"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteTarget({ id: folder.id, type: 'folder', name: folder.name })}
                                  className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                                  title="Ordner löschen"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      const { file } = row;
                      const isOwnShared = file.isShared && file.ownerId === currentOwnerId;
                      const isCutFile = clipboard?.mode === 'cut' && clipboard.type === 'file' && clipboard.id === file.id;
                      const isDraggedFile = draggedItem?.type === 'file' && draggedItem.id === file.id;
                      return (
                        <tr
                          key={row.id}
                          draggable
                          onDragStart={(e) => handleInternalDragStart(e, { type: 'file', id: file.id, name: file.name })}
                          onDragEnd={handleInternalDragEnd}
                          className={`hover:bg-slate-50/80 transition-colors group ${isCutFile || isDraggedFile ? 'opacity-50' : ''}`}
                        >
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                aria-hidden="true"
                                title="Ziehen zum Verschieben"
                                className="text-slate-300 group-hover:text-slate-500 cursor-grab active:cursor-grabbing shrink-0 select-none [-webkit-user-select:none]"
                              >
                                <GripVertical className="w-3.5 h-3.5" />
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenPreview(file)}
                                className="flex items-center gap-3 text-left flex-1 min-w-0 focus-visible:outline-2 focus-visible:outline-hbs-blue rounded-lg"
                              >
                                {renderFileIcon(file.fileExtension)}
                                <div className="min-w-0">
                                  <p className="text-sm font-black text-hbs-slate-dark group-hover:text-hbs-blue truncate max-w-[200px] sm:max-w-md">
                                    {file.name}
                                  </p>
                                  <span className="sm:hidden text-[10px] text-hbs-slate-muted block">
                                    {file.fileExtension.toUpperCase()} • {formatFileSize(file.fileSize)} • {file.ownerName}
                                  </span>
                                </div>
                              </button>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-hbs-slate-muted hidden sm:table-cell">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-black uppercase">
                                {file.fileExtension}
                              </span>
                              {file.subject && (
                                <span className="text-[11px] font-semibold text-hbs-slate-muted">
                                  {file.subject}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-hbs-slate-muted hidden sm:table-cell tabular-nums">
                            {formatFileSize(file.fileSize)}
                          </td>
                          <td className="py-2.5 px-4 text-hbs-slate-muted hidden md:table-cell">
                            {file.ownerName}
                          </td>
                          <td className="py-2.5 px-4 text-hbs-slate-muted hidden lg:table-cell tabular-nums">
                            {formatDate(file.updatedAt || file.createdAt)}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenPreview(file)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-hbs-blue"
                                title="Vorschau / Öffnen"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownload(file)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-hbs-blue"
                                title="Herunterladen"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              {onOpenInKahoot && (
                                <button
                                  type="button"
                                  onClick={() => handleCreateKahootFromMaterial(file)}
                                  className="p-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100"
                                  title="Als Kahoot-Quiz erstellen"
                                >
                                  <Sparkles className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleOpenInUnterrichtsbaukasten(file)}
                                className="p-1.5 rounded-lg bg-blue-50 text-hbs-blue hover:bg-blue-100"
                                title="Im Unterrichtsbaukasten nutzen"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                              {onOpenInBoard && ['pdf', 'png', 'jpg', 'jpeg'].includes(file.fileExtension.toLowerCase()) && (
                                <button
                                  type="button"
                                  onClick={() => handleDisplayOnBoard(file)}
                                  className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                  title="Auf der Schultafel anzeigen"
                                >
                                  <Presentation className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setClipboard({ mode: 'copy', type: 'file', id: file.id, name: file.name, sourceScope: activeScope })}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-hbs-blue"
                                title="Datei kopieren"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setClipboard({ mode: 'cut', type: 'file', id: file.id, name: file.name, sourceScope: activeScope })}
                                className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-700"
                                title="Datei ausschneiden (Verschieben)"
                              >
                                <Scissors className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleShare(file)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-purple-600"
                                title={
                                  file.isShared
                                    ? (isOwnShared ? 'Zurück in Mein Speicher verschieben' : 'In Mein Speicher übernehmen')
                                    : 'In Kollegiums-Austausch teilen'
                                }
                              >
                                {file.isShared ? <FolderInput className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => setRenameTarget({ id: file.id, type: 'file', name: file.name })}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                                title="Umbenennen"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget({ id: file.id, type: 'file', name: file.name, r2Key: file.r2Key })}
                                className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                                title="Löschen"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* GRID VIEW (Folders section + Files section) */
          <>
            {/* 1. SECTION: FOLDERS */}
            {visibleFolders.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs font-black uppercase tracking-wider text-hbs-slate-muted mb-3 flex items-center gap-2">
                  <FolderOpen className="w-3.5 h-3.5 text-hbs-blue" />
                  <span>Ordner ({visibleFolders.length})</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                  {visibleFolders.map((folder) => {
                    const stats = folderStatsMap.get(folder.id) || { fileCount: 0, subFolderCount: 0, totalBytes: 0 };
                    const folderDropKey = `grid-folder:${folder.id}`;
                    const isFolderDropTarget = dropTargetKey === folderDropKey;
                    const isCutFolder = clipboard?.mode === 'cut' && clipboard.type === 'folder' && clipboard.id === folder.id;
                    const isDraggedFolder = draggedItem?.type === 'folder' && draggedItem.id === folder.id;
                    return (
                      <div
                        key={folder.id}
                        draggable
                        onDragStart={(e) => handleInternalDragStart(e, { type: 'folder', id: folder.id, name: folder.name })}
                        onDragEnd={handleInternalDragEnd}
                        onDragOver={(e) => handleTargetDragOver(e, folderDropKey, folder.id)}
                        onDragLeave={(e) => handleTargetDragLeave(e, folderDropKey)}
                        onDrop={(e) => handleDropOnTarget(e, activeScope, folder.id)}
                        onClick={() => setCurrentFolderId(folder.id)}
                        className={`group relative p-4 rounded-2xl border shadow-xs transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                          isFolderDropTarget
                            ? 'bg-hbs-blue-soft/70 border-hbs-blue ring-2 ring-hbs-blue scale-[1.02] shadow-md'
                            : 'bg-white hover:bg-blue-50/50 border-slate-200/80 hover:border-hbs-blue/40 hover:shadow-md'
                        } ${isCutFolder || isDraggedFolder ? 'opacity-50 border-dashed' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="w-10 h-10 rounded-xl bg-amber-50 group-hover:bg-amber-100 text-amber-500 flex items-center justify-center transition-all">
                            <Folder className="w-5 h-5 fill-amber-500 text-amber-600" />
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setClipboard({ mode: 'copy', type: 'folder', id: folder.id, name: folder.name, sourceScope: activeScope });
                              }}
                              className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-hbs-blue"
                              title="Kopieren"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setClipboard({ mode: 'cut', type: 'folder', id: folder.id, name: folder.name, sourceScope: activeScope });
                              }}
                              className="p-1 rounded-md hover:bg-amber-50 text-slate-400 hover:text-amber-700"
                              title="Ausschneiden"
                            >
                              <Scissors className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
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
                              type="button"
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
                            {stats.fileCount} {stats.fileCount === 1 ? 'Datei' : 'Dateien'}
                            {stats.subFolderCount > 0 ? ` • ${stats.subFolderCount} Ordner` : ''}
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
                    Tipp: Mit ✨ direkt als Quiz für den Kahoot-Nachbau nutzen
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
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {visibleFiles.map((file) => {
                    const isOwnShared = file.isShared && file.ownerId === currentOwnerId;
                    const isCutFile = clipboard?.mode === 'cut' && clipboard.type === 'file' && clipboard.id === file.id;
                    const isDraggedFile = draggedItem?.type === 'file' && draggedItem.id === file.id;
                    return (
                      <div
                        key={file.id}
                        draggable
                        onDragStart={(e) => handleInternalDragStart(e, { type: 'file', id: file.id, name: file.name })}
                        onDragEnd={handleInternalDragEnd}
                        className={`group relative p-4 rounded-3xl bg-white border border-slate-200/80 hover:border-hbs-blue/40 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-grab active:cursor-grabbing ${
                          isCutFile || isDraggedFile ? 'opacity-50 border-dashed' : ''
                        }`}
                      >
                        {/* Top Header of Card */}
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-3">
                            {renderFileIcon(file.fileExtension)}
                            
                            {/* Badge: Shared vs Personal + Drag Hint */}
                            <div className="flex items-center gap-1.5">
                              <span
                                aria-hidden="true"
                                title="Ziehen zum Verschieben"
                                className="text-slate-300 group-hover:text-slate-400 select-none [-webkit-user-select:none]"
                              >
                                <GripVertical className="w-3.5 h-3.5" />
                              </span>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                file.isShared 
                                  ? 'bg-purple-100 text-purple-700' 
                                  : 'bg-blue-100 text-hbs-blue'
                              }`}>
                                {file.isShared ? 'Austausch' : 'Mein'}
                              </span>
                            </div>
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
                            <span className="truncate">{file.ownerName}</span>
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

                          <div className="flex items-center gap-0.5 flex-wrap justify-end">
                            {/* Copy */}
                            <button
                              type="button"
                              onClick={() => setClipboard({ mode: 'copy', type: 'file', id: file.id, name: file.name, sourceScope: activeScope })}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-hbs-blue transition-all"
                              title="Kopieren"
                            >
                              <Copy className="w-4 h-4" />
                            </button>

                            {/* Cut */}
                            <button
                              type="button"
                              onClick={() => setClipboard({ mode: 'cut', type: 'file', id: file.id, name: file.name, sourceScope: activeScope })}
                              className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-700 transition-all"
                              title="Ausschneiden (Verschieben)"
                            >
                              <Scissors className="w-4 h-4" />
                            </button>

                            {/* Share / Move to personal toggle */}
                            <button
                              type="button"
                              onClick={() => handleToggleShare(file)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-purple-600 transition-all"
                              title={
                                file.isShared
                                  ? (isOwnShared ? 'Zurück in Mein Speicher verschieben' : 'In Mein Speicher übernehmen')
                                  : 'In Austauschbereich teilen'
                              }
                            >
                              {file.isShared ? <FolderInput className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                            </button>

                            {/* Rename */}
                            <button
                              type="button"
                              onClick={() => setRenameTarget({ id: file.id, type: 'file', name: file.name })}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
                              title="Umbenennen"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => setDeleteTarget({ id: file.id, type: 'file', name: file.name, r2Key: file.r2Key })}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all"
                              title="Löschen"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

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
            ownerName: currentUser ? formatTeacherName(currentUser) : 'Kollege',
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
            {deleteTarget.type === 'folder' && (() => {
              const stats = folderStatsMap.get(deleteTarget.id);
              if (!stats || (stats.fileCount === 0 && stats.subFolderCount === 0)) return null;
              return (
                <p className="mt-2.5 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-900">
                  Hinweis: Dieser Ordner enthält noch {stats.fileCount} {stats.fileCount === 1 ? 'Datei' : 'Dateien'}
                  {stats.subFolderCount > 0 ? ` und ${stats.subFolderCount} Unterordner` : ''}.
                </p>
              );
            })()}
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
