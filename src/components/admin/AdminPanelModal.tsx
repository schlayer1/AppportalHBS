import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  UserPlus, 
  Trash2, 
  RotateCcw, 
  Printer, 
  CloudDownload, 
  Check, 
  ShieldCheck, 
  ShieldAlert, 
  LayoutTemplate, 
  Search, 
  Edit2,
  ThumbsUp,
  MessageSquarePlus,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PortalUser } from '../../types/user';
import { 
  DEFAULT_FIREBASE_CONFIG, 
  DEFAULT_SCHOOL_ID,
  subscribeToFeatureRequests,
  updateFeatureRequestStatus,
  deleteFeatureRequest
} from '../../services/firebase';
import { 
  FeatureRequest, 
  RequestStatus 
} from '../../types/requestTypes';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({ isOpen, onClose }) => {
  const { 
    users, 
    saveUsersList, 
    syncWithVertretungsstatistik, 
    boardTemplates, 
    deleteBoardTemplate 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'users' | 'templates' | 'requests' | 'sync'>('users');
  const [searchUser, setSearchUser] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<{ added: number; updated: number; total: number } | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // New User Form State
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newUserName, setNewUserName] = useState<string>('');
  const [newUserPin, setNewUserPin] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<'teacher' | 'admin'>('teacher');

  // Editing User State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editPin, setEditPin] = useState<string>('');
  const [editRole, setEditRole] = useState<'teacher' | 'admin'>('teacher');
  // Feature Requests State
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [requestSearch, setRequestSearch] = useState<string>('');
  const [requestStatusFilter, setRequestStatusFilter] = useState<'all' | RequestStatus>('all');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [adminCommentText, setAdminCommentText] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeToFeatureRequests((items) => {
      setRequests(items);
    });
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchUser.toLowerCase().trim())
  );

  const schoolTemplates = boardTemplates.filter(t => t.isSchoolTemplate);

  // Handle Add New User
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    const pin = newUserPin.trim().length === 4 
      ? newUserPin.trim() 
      : Math.floor(1000 + Math.random() * 9000).toString();

    const newUser: PortalUser = {
      id: `user-${Date.now()}`,
      name: newUserName.trim(),
      pin,
      role: newUserRole,
      active: true,
      createdAt: Date.now()
    };

    const updated = [...users, newUser];
    await saveUsersList(updated);
    setNewUserName('');
    setNewUserPin('');
    setShowAddForm(false);
  };

  // Start Edit User
  const handleStartEdit = (user: PortalUser) => {
    setEditingUserId(user.id);
    setEditName(user.name);
    setEditPin(user.pin);
    setEditRole(user.role);
  };

  // Save Edit User
  const handleSaveEdit = async () => {
    if (!editingUserId || !editName.trim()) return;
    const currentUserObj = users.find(u => u.id === editingUserId);
    const pin = editPin.trim().length === 4 
      ? editPin.trim() 
      : (currentUserObj?.pin || Math.floor(1000 + Math.random() * 9000).toString());

    const updated = users.map(u => {
      if (u.id === editingUserId) {
        return {
          ...u,
          name: editName.trim(),
          pin,
          role: editRole
        };
      }
      return u;
    });

    await saveUsersList(updated);
    setEditingUserId(null);
  };

  // Delete User
  const handleDeleteUser = async (id: string) => {
    if (confirm('Möchten Sie diese Lehrkraft wirklich aus dem Portal entfernen?')) {
      const updated = users.filter(u => u.id !== id);
      await saveUsersList(updated);
    }
  };

  // Trigger Sync with Vertretungsstatistik
  const handleSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    setSyncError(null);
    try {
      const res = await syncWithVertretungsstatistik();
      setSyncResult(res);
    } catch (err: any) {
      setSyncError(err.message || 'Fehler beim Synchronisieren');
    } finally {
      setIsSyncing(false);
    }
  };

  // Print Teacher PIN List (like in Vertretungsstatistik)
  const handlePrintPinList = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rowsHtml = users
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((u, i) => `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11pt;">
          <td style="padding: 8px 12px; font-weight: bold; color: #1e293b;">${i + 1}. ${u.name}</td>
          <td style="padding: 8px 12px; text-align: center; color: #64748b;">${u.role === 'admin' ? 'Admin' : 'Lehrkraft'}</td>
          <td style="padding: 8px 12px; text-align: center; font-family: monospace; font-size: 14pt; font-weight: 900; color: #00766c; letter-spacing: 3px;">${u.pin}</td>
        </tr>
      `)
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>PIN-Liste Kollegium - Heimbürgeschule Kahla</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; }
            h1 { font-size: 16pt; margin: 0 0 4px 0; color: #0f172a; }
            p { font-size: 10pt; color: #64748b; margin: 0 0 20px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background-color: #f8fafc; border-bottom: 2px solid #cbd5e1; padding: 10px; text-align: left; font-size: 10pt; text-transform: uppercase; color: #475569; }
          </style>
        </head>
        <body>
          <h1>Staatliche Regelschule Heimbürgeschule Kahla</h1>
          <p>PIN-Liste für das Kollegium – Vertraulicher Zugang zum HBS App-Portal</p>
          <table>
            <thead>
              <tr>
                <th>Lehrkraft</th>
                <th style="text-align: center;">Rolle</th>
                <th style="text-align: center;">4-stellige PIN</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <p style="margin-top: 25px; font-size: 9pt; color: #94a3b8;">
            Erstellt am ${new Date().toLocaleDateString('de-DE')} • HBS App-Portal • Vertraulich
          </p>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-800 border border-amber-300/50 flex items-center justify-center shadow-2xs">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-hbs-slate-dark">
                Admin-Panel • Heimbürgeschule
              </h2>
              <p className="text-xs text-hbs-slate-muted">
                Kollegiums-Verwaltung, Standardvorlagen & Firebase-Cloud
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 text-hbs-slate-dark flex items-center justify-center transition-all active:scale-95"
            title="Schließen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 border-b border-slate-100 bg-white shrink-0">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'border-hbs-blue text-hbs-blue'
                : 'border-transparent text-hbs-slate-muted hover:text-hbs-slate-dark'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Lehrkräfte & PINs ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'templates'
                ? 'border-hbs-teal-deep text-hbs-teal-deep'
                : 'border-transparent text-hbs-slate-muted hover:text-hbs-slate-dark'
            }`}
          >
            <LayoutTemplate className="w-4 h-4" />
            <span>Schul-Tafelvorlagen ({schoolTemplates.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'requests'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-hbs-slate-muted hover:text-hbs-slate-dark'
            }`}
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Kollegiums-Wünsche ({requests.length})</span>
            {requests.filter(r => r.status === 'eingereicht' || r.status === 'in_pruefung').length > 0 && (
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-700">
                {requests.filter(r => r.status === 'eingereicht' || r.status === 'in_pruefung').length} neu
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('sync')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'sync'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-hbs-slate-muted hover:text-hbs-slate-dark'
            }`}
          >
            <CloudDownload className="w-4 h-4" />
            <span>Vertretungsstatistik-Sync & Cloud</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/30">
          
          {/* TAB 1: USERS & PINS */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Action Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-hbs-slate-light absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    placeholder="Lehrkraft suchen..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-hbs-blue/30"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={handlePrintPinList}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-hbs-slate-dark border border-slate-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
                    title="Druckreife PIN-Liste für das Kollegium drucken"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>PIN-Liste drucken</span>
                  </button>

                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-3 py-1.5 rounded-xl bg-hbs-blue hover:bg-hbs-blue-deep text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Kollege anlegen</span>
                  </button>
                </div>
              </div>

              {/* Add New User Form */}
              {showAddForm && (
                <form onSubmit={handleAddUser} className="p-4 bg-white rounded-2xl border border-hbs-blue/30 shadow-sm space-y-3 animate-fadeIn">
                  <span className="text-xs font-black text-hbs-slate-dark block">
                    Neue Lehrkraft anlegen:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="Name (z. B. Fr. Müller)"
                      className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 font-bold"
                      required
                    />
                    <input
                      type="text"
                      maxLength={4}
                      value={newUserPin}
                      onChange={(e) => setNewUserPin(e.target.value)}
                      placeholder="4-stellige PIN (z. B. 5821)"
                      className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold"
                    />
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as any)}
                      className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 font-bold"
                    >
                      <option value="teacher">Lehrkraft</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-3 py-1 rounded-lg text-xs font-bold text-hbs-slate-muted hover:bg-slate-100"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1 rounded-xl bg-hbs-blue text-white text-xs font-bold shadow-xs"
                    >
                      Speichern
                    </button>
                  </div>
                </form>
              )}

              {/* Users Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase text-hbs-slate-muted">
                      <th className="p-3">Name</th>
                      <th className="p-3 text-center">Rolle</th>
                      <th className="p-3 text-center">PIN</th>
                      <th className="p-3 text-right">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-hbs-slate-muted">
                          Keine Lehrkräfte gefunden
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => {
                        const isEditing = editingUserId === user.id;

                        if (isEditing) {
                          return (
                            <tr key={user.id} className="bg-hbs-blue-soft/30">
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="px-2 py-1 bg-white border border-slate-300 rounded font-bold text-xs w-full"
                                />
                              </td>
                              <td className="p-2 text-center">
                                <select
                                  value={editRole}
                                  onChange={(e) => setEditRole(e.target.value as any)}
                                  className="px-2 py-1 bg-white border border-slate-300 rounded font-bold text-xs"
                                >
                                  <option value="teacher">Lehrkraft</option>
                                  <option value="admin">Admin</option>
                                </select>
                              </td>
                              <td className="p-2 text-center">
                                <input
                                  type="text"
                                  maxLength={4}
                                  value={editPin}
                                  onChange={(e) => setEditPin(e.target.value)}
                                  className="px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-xs text-center w-16"
                                />
                              </td>
                              <td className="p-2 text-right space-x-1">
                                <button
                                  type="button"
                                  onClick={handleSaveEdit}
                                  className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-bold"
                                >
                                  OK
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingUserId(null)}
                                  className="px-2 py-1 bg-slate-200 text-hbs-slate-dark rounded text-xs font-bold"
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-bold text-hbs-slate-dark flex items-center gap-2">
                              <span>{user.name}</span>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                user.role === 'admin'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {user.role === 'admin' ? 'Admin' : 'Lehrer'}
                              </span>
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-hbs-teal-deep tracking-wider">
                              {user.pin}
                            </td>
                            <td className="p-3 text-right space-x-1">
                              <button
                                onClick={() => handleStartEdit(user)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-hbs-slate-muted hover:text-hbs-blue"
                                title="Bearbeiten / PIN ändern"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-hbs-slate-muted hover:text-red-600"
                                title="Löschen"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: SCHOOL BOARD TEMPLATES */}
          {activeTab === 'templates' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-hbs-slate-dark">
                    Zentrale Standard-Tafelbilder für alle Kollegen
                  </h3>
                  <p className="text-xs text-hbs-slate-muted">
                    Diese Vorlagen stehen dem gesamten Kollegium auf der Digitalen Tafel zur Verfügung.
                  </p>
                </div>
              </div>

              {schoolTemplates.length === 0 ? (
                <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-hbs-slate-muted">
                  <LayoutTemplate className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <span className="text-xs font-bold block text-hbs-slate-dark">Noch keine Schulvorlagen gespeichert</span>
                  <span className="text-[11px] text-hbs-slate-muted max-w-sm block mx-auto mt-1">
                    Öffnen Sie die Digitale Tafel, richten Sie die Widgets und den Hintergrund ein und klicken Sie oben auf „Tafelbild speichern“ mit der Option „Als Schulvorlage freigeben“.
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {schoolTemplates.map((tmpl) => (
                    <div key={tmpl.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <h4 className="text-xs font-black text-hbs-slate-dark truncate">
                            {tmpl.title}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-hbs-teal-deep/10 text-hbs-teal-deep border border-hbs-teal-deep/20 text-[10px] font-black shrink-0">
                            Schulvorlage
                          </span>
                        </div>
                        <p className="text-[11px] text-hbs-slate-muted">
                          {tmpl.screen.widgets.length} Widgets • Hintergrund: {tmpl.screen.backgroundId}
                        </p>
                      </div>

                      <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          Von {tmpl.authorName}
                        </span>
                        <button
                          onClick={() => deleteBoardTemplate(tmpl.id)}
                          className="px-2 py-1 rounded-lg text-[11px] font-bold text-red-600 hover:bg-red-50"
                        >
                          Vorlage löschen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: KOLLEGIUMS-WÜNSCHE & REQUEST MANAGEMENT */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              {/* Stats Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Offen / Neu</span>
                  <span className="text-xl font-black text-slate-800">
                    {requests.filter(r => r.status === 'eingereicht').length}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-black uppercase text-amber-600 block">In Prüfung</span>
                  <span className="text-xl font-black text-amber-800">
                    {requests.filter(r => r.status === 'in_pruefung').length}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-black uppercase text-cyan-600 block">In Planung</span>
                  <span className="text-xl font-black text-cyan-800">
                    {requests.filter(r => r.status === 'in_planung').length}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-2xl border border-emerald-200 bg-emerald-50/40 shadow-2xs">
                  <span className="text-[10px] font-black uppercase text-emerald-700 block">Eingebaut & Fertig ✓</span>
                  <span className="text-xl font-black text-emerald-800">
                    {requests.filter(r => r.status === 'umgesetzt').length}
                  </span>
                </div>
              </div>

              {/* Toolbar: Search & Status Filters */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={requestSearch}
                    onChange={(e) => setRequestSearch(e.target.value)}
                    placeholder="Wünsche nach Titel, Text oder Kollege suchen..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  />
                  {requestSearch && (
                    <button 
                      onClick={() => setRequestSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
                  <button
                    onClick={() => setRequestStatusFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                      requestStatusFilter === 'all'
                        ? 'bg-slate-800 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    Alle ({requests.length})
                  </button>
                  <button
                    onClick={() => setRequestStatusFilter('eingereicht')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                      requestStatusFilter === 'eingereicht'
                        ? 'bg-slate-700 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    Offen
                  </button>
                  <button
                    onClick={() => setRequestStatusFilter('in_pruefung')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                      requestStatusFilter === 'in_pruefung'
                        ? 'bg-amber-600 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    In Prüfung
                  </button>
                  <button
                    onClick={() => setRequestStatusFilter('in_planung')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                      requestStatusFilter === 'in_planung'
                        ? 'bg-cyan-600 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    In Planung
                  </button>
                  <button
                    onClick={() => setRequestStatusFilter('umgesetzt')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                      requestStatusFilter === 'umgesetzt'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    Eingebaut ✓
                  </button>
                </div>
              </div>

              {/* Request Cards List */}
              {requests.length === 0 ? (
                <div className="p-8 bg-white rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                  Noch keine Wünsche oder Anfragen aus dem Kollegium eingereicht.
                </div>
              ) : (
                <div className="space-y-3">
                  {requests
                    .filter((r) => {
                      const matchesStatus = requestStatusFilter === 'all' || r.status === requestStatusFilter;
                      const q = requestSearch.toLowerCase().trim();
                      const matchesSearch = !q || 
                        r.title.toLowerCase().includes(q) || 
                        r.description.toLowerCase().includes(q) || 
                        r.authorName.toLowerCase().includes(q);
                      return matchesStatus && matchesSearch;
                    })
                    .map((req) => {
                      const isEditingComment = editingCommentId === req.id;

                      return (
                        <div
                          key={req.id}
                          className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3 transition-all"
                        >
                          {/* Top Row: Meta Badges */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Category Badge */}
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                                {req.category === 'wunsch' ? 'Funktionswunsch' :
                                 req.category === 'app_idee' ? 'App-Idee' :
                                 req.category === 'unterricht' ? 'Unterricht & Didaktik' : 'Problem / Fehler'}
                              </span>

                              {/* Status Badge */}
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                                req.status === 'umgesetzt' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                                req.status === 'in_planung' ? 'bg-cyan-100 text-cyan-800 border-cyan-300' :
                                req.status === 'in_pruefung' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                                req.status === 'geschlossen' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                                'bg-slate-100 text-slate-700 border-slate-200'
                              }`}>
                                {req.status === 'umgesetzt' ? 'Eingebaut & Bereitgestellt ✓' :
                                 req.status === 'in_planung' ? 'In Planung' :
                                 req.status === 'in_pruefung' ? 'In Prüfung' :
                                 req.status === 'geschlossen' ? 'Geschlossen / Abgelehnt' : 'Neu eingereicht'}
                              </span>

                              <span className="text-xs text-slate-400 font-medium">
                                von <strong>{req.authorName}</strong> • {new Date(req.createdAt).toLocaleDateString('de-DE')}
                              </span>
                            </div>

                            {/* Votes Counter */}
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-xs font-black shrink-0">
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span>{req.votes?.length || 0} {req.votes?.length === 1 ? 'Stimme' : 'Stimmen'}</span>
                            </div>
                          </div>

                          {/* Content */}
                          <div>
                            <h4 className="text-sm sm:text-base font-black text-slate-800">
                              {req.title}
                            </h4>
                            <p className="text-xs text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                              {req.description}
                            </p>
                          </div>

                          {/* Admin Feedback Display */}
                          {req.adminComment && !isEditingComment && (
                            <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2">
                                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold">Admin-Rückmeldung an das Kollegium: </span>
                                  <span>{req.adminComment}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setEditingCommentId(req.id);
                                  setAdminCommentText(req.adminComment || '');
                                }}
                                className="text-[11px] font-bold text-blue-700 hover:underline shrink-0"
                              >
                                Bearbeiten
                              </button>
                            </div>
                          )}

                          {/* Admin Feedback Input Editor */}
                          {isEditingComment && (
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                              <label className="text-[11px] font-bold text-slate-700 block">
                                Offizielle Rückmeldung / Begründung für das Kollegium hinterlegen:
                              </label>
                              <textarea
                                value={adminCommentText}
                                onChange={(e) => setAdminCommentText(e.target.value)}
                                placeholder="z. B. In Version 2.3.0 eingebaut und freigeschaltet!"
                                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500/30 bg-white"
                                rows={2}
                              />
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditingCommentId(null);
                                    setAdminCommentText('');
                                  }}
                                  className="px-3 py-1 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200"
                                >
                                  Abbrechen
                                </button>
                                <button
                                  onClick={async () => {
                                    await updateFeatureRequestStatus(req.id, req.status, adminCommentText.trim());
                                    setEditingCommentId(null);
                                    setAdminCommentText('');
                                  }}
                                  className="px-3.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs"
                                >
                                  Rückmeldung speichern
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Admin Action Buttons Row */}
                          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-black uppercase text-slate-400">
                                Status ändern:
                              </span>

                              <button
                                onClick={() => updateFeatureRequestStatus(req.id, 'eingereicht', req.adminComment)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                                  req.status === 'eingereicht'
                                    ? 'bg-slate-800 text-white border-slate-800'
                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                                }`}
                              >
                                Neu / Offen
                              </button>

                              <button
                                onClick={() => updateFeatureRequestStatus(req.id, 'in_pruefung', req.adminComment)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                                  req.status === 'in_pruefung'
                                    ? 'bg-amber-600 text-white border-amber-600'
                                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-200'
                                }`}
                              >
                                In Prüfung
                              </button>

                              <button
                                onClick={() => updateFeatureRequestStatus(req.id, 'in_planung', req.adminComment)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                                  req.status === 'in_planung'
                                    ? 'bg-cyan-600 text-white border-cyan-600'
                                    : 'bg-cyan-50 text-cyan-800 hover:bg-cyan-100 border-cyan-200'
                                }`}
                              >
                                In Planung
                              </button>

                              <button
                                onClick={() => updateFeatureRequestStatus(req.id, 'umgesetzt', req.adminComment || 'In Version 2.3.0 eingebaut!')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                                  req.status === 'umgesetzt'
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-300'
                                }`}
                                title="Wunsch als eingebaut / hinzugefügt markieren"
                              >
                                Eingebaut & Bereitgestellt ✓
                              </button>

                              <button
                                onClick={() => updateFeatureRequestStatus(req.id, 'geschlossen', req.adminComment)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                                  req.status === 'geschlossen'
                                    ? 'bg-slate-600 text-white border-slate-600'
                                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-200'
                                }`}
                              >
                                Schließen
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              {!req.adminComment && !isEditingComment && (
                                <button
                                  onClick={() => {
                                    setEditingCommentId(req.id);
                                    setAdminCommentText('');
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 text-xs font-bold flex items-center gap-1"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>Rückmeldung verfassen</span>
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  if (window.confirm(`Möchten Sie den Eintrag „${req.title}“ wirklich löschen?`)) {
                                    deleteFeatureRequest(req.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200"
                                title="Eintrag löschen"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: VERTRETUNGSSTATISTIK SYNC & CLOUD */}
          {activeTab === 'sync' && (
            <div className="space-y-4 max-w-2xl">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-sm font-black text-hbs-slate-dark">
                  <CloudDownload className="w-5 h-5 text-amber-600" />
                  <span>1-Klick-Sync mit der Vertretungsstatistik</span>
                </div>

                <p className="text-xs text-hbs-slate-muted leading-relaxed">
                  Laden Sie alle Lehrkräfte und bestehende 4-stellige PINs automatisch aus dem Firebase-Projekt der <strong>Vertretungsstatistik</strong> herunter. Neue Kollegen werden sofort übernommen, bereits vergebene PINs abgeglichen.
                </p>

                {syncResult && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Synchronisation erfolgreich: {syncResult.added} neue Lehrkräfte hinzugefügt, {syncResult.updated} aktualisiert. Gesamt: {syncResult.total} Kollegen.
                    </span>
                  </div>
                )}

                {syncError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{syncError}</span>
                  </div>
                )}

                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                >
                  <RotateCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Synchronisiere mit Firebase...' : 'Jetzt mit Vertretungsstatistik abgleichen'}</span>
                </button>
              </div>

              {/* Technical Cloud Details */}
              <div className="p-4 bg-slate-100/60 rounded-2xl border border-slate-200 text-xs text-hbs-slate-muted space-y-2">
                <span className="font-bold text-hbs-slate-dark block">
                  Firebase Cloud-Status:
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div>Projekt-ID: <span className="text-hbs-slate-dark font-bold">{DEFAULT_FIREBASE_CONFIG.projectId}</span></div>
                  <div>Schul-Kürzel: <span className="text-hbs-slate-dark font-bold">{DEFAULT_SCHOOL_ID}</span></div>
                  <div>Auth-Domain: <span className="text-hbs-slate-dark">{DEFAULT_FIREBASE_CONFIG.authDomain}</span></div>
                  <div>Speicherort: <span className="text-hbs-slate-dark font-bold">Cloud Firestore</span></div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
