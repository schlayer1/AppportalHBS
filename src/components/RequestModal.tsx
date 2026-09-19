import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Sparkles, Plus, ThumbsUp, 
  Search, CheckCircle2, AlertTriangle, Lightbulb, 
  BookOpen, Trash2, ShieldCheck, History
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  FeatureRequest, 
  RequestCategory, 
  RequestStatus 
} from '../types/requestTypes';
import { 
  subscribeToFeatureRequests, 
  submitFeatureRequest, 
  toggleVoteFeatureRequest, 
  updateFeatureRequestStatus, 
  deleteFeatureRequest 
} from '../services/firebase';

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChangelog?: () => void;
}

const CATEGORY_CONFIG: Record<RequestCategory, { label: string; icon: React.FC<{ className?: string }>; color: string; badge: string }> = {
  wunsch: { label: 'Funktionswunsch', icon: Sparkles, color: 'text-purple-700 bg-purple-100 border-purple-200', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  app_idee: { label: 'Neue App-Idee', icon: Lightbulb, color: 'text-blue-700 bg-blue-100 border-blue-200', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  unterricht: { label: 'Unterricht & Didaktik', icon: BookOpen, color: 'text-emerald-700 bg-emerald-100 border-emerald-200', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  problem: { label: 'Problem / Bug', icon: AlertTriangle, color: 'text-rose-700 bg-rose-100 border-rose-200', badge: 'bg-rose-50 text-rose-700 border-rose-200' }
};

const STATUS_CONFIG: Record<RequestStatus, { label: string; color: string }> = {
  eingereicht: { label: 'Eingereicht', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  in_pruefung: { label: 'In Prüfung', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  in_planung: { label: 'In Planung', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  umgesetzt: { label: 'Umgesetzt ✓', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  geschlossen: { label: 'Geschlossen', color: 'bg-slate-100 text-slate-500 border-slate-200' }
};

export const RequestModal: React.FC<RequestModalProps> = ({ isOpen, onClose, onOpenChangelog }) => {
  const { currentUser, isAdmin } = useAuth();
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [selectedCategory, setSelectedCategory] = useState<'all' | RequestCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<RequestCategory>('wunsch');
  const [authorName, setAuthorName] = useState(currentUser?.name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Identifier for voting
  const voterId = useMemo(() => {
    if (currentUser?.id) return currentUser.id;
    let localId = localStorage.getItem('hbs_portal_voter_id');
    if (!localId) {
      localId = 'anon-' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('hbs_portal_voter_id', localId);
    }
    return localId;
  }, [currentUser]);

  // Update author name if user changes
  useEffect(() => {
    if (currentUser?.name) {
      setAuthorName(currentUser.name);
    }
  }, [currentUser]);

  // Subscribe to real-time feature requests
  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = subscribeToFeatureRequests((items) => {
      setRequests(items);
    });
    return () => unsubscribe();
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await submitFeatureRequest({
        title: title.trim(),
        description: description.trim(),
        category,
        authorName: authorName.trim() || 'Kollege/in',
        authorId: currentUser?.id || voterId
      });

      if (res) {
        setTitle('');
        setDescription('');
        setCategory('wunsch');
        setSubmitSuccess(true);
        setTimeout(() => {
          setSubmitSuccess(false);
          setActiveTab('list');
        }, 1500);
      }
    } catch (err) {
      console.error("Submit error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (requestId: string) => {
    await toggleVoteFeatureRequest(requestId, voterId);
  };

  const handleStatusChange = async (requestId: string, status: RequestStatus) => {
    await updateFeatureRequestStatus(requestId, status);
  };

  const handleDelete = async (requestId: string) => {
    if (window.confirm("Diesen Eintrag wirklich löschen?")) {
      await deleteFeatureRequest(requestId);
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const matchesCategory = selectedCategory === 'all' || req.category === selectedCategory;
      const matchesSearch = searchQuery === '' || 
        req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.authorName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [requests, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-6 flex items-center justify-center bg-hbs-slate-dark/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl shadow-black/40 border border-hbs-slate-border/80 w-full max-w-3xl flex flex-col max-h-[90dvh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4 shrink-0 bg-gradient-to-r from-slate-50 via-white to-purple-50/40">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0 mt-0.5">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-700 px-2.5 py-0.5 bg-purple-100/80 rounded-full border border-purple-200">
                  Kollegiums-Feedback
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  App-Portal HBS
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight mt-1">
                Wünsche, Anfragen & Feedback
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Reichen Sie App-Vorschläge ein, melden Sie Probleme und stimmen Sie für Ideen ab.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center shrink-0"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 sm:px-6 pt-3 pb-2 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'list'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
              }`}
            >
              <span>Alle Einträge</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                activeTab === 'list' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {requests.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('create')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'create'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Neuer Wunsch</span>
            </button>
          </div>

          {onOpenChangelog && (
            <button
              onClick={() => {
                onClose();
                onOpenChangelog();
              }}
              className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Changelog anzeigen</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6">
          {activeTab === 'create' ? (
            /* Creation Form */
            <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto py-2">
              {submitSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-bold animate-fadeIn">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Vielen Dank! Ihr Wunsch wurde erfolgreich eingereicht.</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Kategorie *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.keys(CATEGORY_CONFIG) as RequestCategory[]).map((catKey) => {
                    const cfg = CATEGORY_CONFIG[catKey];
                    const Icon = cfg.icon;
                    const isSelected = category === catKey;
                    return (
                      <button
                        type="button"
                        key={catKey}
                        onClick={() => setCategory(catKey)}
                        className={`p-3 rounded-2xl border text-left flex flex-col items-start gap-1.5 transition-all ${
                          isSelected 
                            ? 'bg-purple-50/80 border-purple-500 ring-2 ring-purple-500/20' 
                            : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isSelected ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 line-clamp-1">
                          {cfg.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Titel der Anfrage / Idee *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="z.B. Interaktiver Stundenplan-Export oder neue App 'GeoGebra'"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Beschreibung & Begründung *
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Beschreiben Sie kurz, wie die Funktion Ihnen oder den Schülern im Schulalltag helfen würde..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-medium resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Name / Kürzel (optional)
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="z.B. Frau Keller oder Kollegium"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim() || !description.trim()}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-500/20 transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSubmitting ? 'Wird gespeichert...' : 'Wunsch absenden'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Request List */
            <div className="space-y-4">
              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Wünsche & Ideen durchsuchen..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs font-medium"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                      selectedCategory === 'all'
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Alle
                  </button>
                  {(Object.keys(CATEGORY_CONFIG) as RequestCategory[]).map((catKey) => {
                    const cfg = CATEGORY_CONFIG[catKey];
                    const isSelected = selectedCategory === catKey;
                    return (
                      <button
                        key={catKey}
                        onClick={() => setSelectedCategory(catKey)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                          isSelected
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Items List */}
              {filteredRequests.length === 0 ? (
                <div className="text-center py-12 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <Lightbulb className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-slate-700">
                    {searchQuery ? 'Keine Einträge für diese Suche gefunden' : 'Noch keine Wünsche eingereicht'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                    Haben Sie eine Idee für eine neue Funktion, ein Tool für die digitale Tafel oder eine Schul-App?
                  </p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Ersten Wunsch eintragen
                  </button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredRequests.map((req) => {
                    const catCfg = CATEGORY_CONFIG[req.category] || CATEGORY_CONFIG.wunsch;
                    const statusCfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.eingereicht;
                    const hasVoted = req.votes?.includes(voterId);
                    const voteCount = req.votes?.length || 0;

                    return (
                      <div
                        key={req.id}
                        className="bg-white border border-slate-200 hover:border-purple-300 rounded-2xl p-4 transition-all duration-150 flex flex-col sm:flex-row items-start gap-4 hover:shadow-sm"
                      >
                        {/* Upvote Button */}
                        <button
                          onClick={() => handleVote(req.id)}
                          className={`flex sm:flex-col items-center justify-center gap-1.5 px-3 py-2 sm:px-3 sm:py-2.5 rounded-xl border font-bold transition-all shrink-0 w-full sm:w-14 ${
                            hasVoted
                              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                              : 'bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border-slate-200'
                          }`}
                          title={hasVoted ? 'Stimme zurückziehen' : 'Dafür stimmen (+1)'}
                        >
                          <ThumbsUp className={`w-4 h-4 ${hasVoted ? 'fill-current' : ''}`} />
                          <span className="text-xs">{voteCount}</span>
                        </button>

                        {/* Details */}
                        <div className="flex-1 min-w-0 w-full">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catCfg.badge}`}>
                              {catCfg.label}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.color}`}>
                              {statusCfg.label}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              von {req.authorName || 'Kollege/in'}
                            </span>
                          </div>

                          <h4 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">
                            {req.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                            {req.description}
                          </p>

                          {/* Admin comment if present */}
                          {req.adminComment && (
                            <div className="mt-2.5 p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 font-medium flex items-start gap-2">
                              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">Antwort Admin: </span>
                                <span>{req.adminComment}</span>
                              </div>
                            </div>
                          )}

                          {/* Admin Controls */}
                          {isAdmin && (
                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] uppercase font-bold text-slate-400">
                                  Status ändern:
                                </span>
                                {(Object.keys(STATUS_CONFIG) as RequestStatus[]).map((st) => (
                                  <button
                                    key={st}
                                    onClick={() => handleStatusChange(req.id, st)}
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all ${
                                      req.status === st 
                                        ? 'bg-slate-800 text-white border-slate-800' 
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                                    }`}
                                  >
                                    {STATUS_CONFIG[st].label}
                                  </button>
                                ))}
                              </div>

                              <button
                                onClick={() => handleDelete(req.id)}
                                className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 p-1.5 rounded-lg transition-all"
                                title="Eintrag löschen"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-slate-500">
            Jede Stimme zählt! Die meistgewünschten Funktionen fließen direkt in kommende Portal-Updates ein.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all"
            >
              Schließen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
