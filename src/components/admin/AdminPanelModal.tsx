import React, { useState } from 'react';
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
  Edit2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PortalUser } from '../../types/user';
import { DEFAULT_FIREBASE_CONFIG, DEFAULT_SCHOOL_ID } from '../../services/firebase';

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

  const [activeTab, setActiveTab] = useState<'users' | 'templates' | 'sync'>('users');
  const [searchUser, setSearchUser] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<{ added: number; updated: number; total: number } | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

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

  if (!isOpen) return null;

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchUser.toLowerCase().trim())
  );

  const schoolTemplates = boardTemplates.filter(t => t.isSchoolTemplate);

  // Handle Add New User
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    const pin = newUserPin.trim().length === 4 ? newUserPin.trim() : '1234';

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
    const pin = editPin.trim().length === 4 ? editPin.trim() : '1234';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        
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
                      placeholder="4-stellige PIN (Standard: 1234)"
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

          {/* TAB 3: VERTRETUNGSSTATISTIK SYNC & CLOUD */}
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
