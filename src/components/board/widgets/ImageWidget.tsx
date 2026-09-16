import React, { useState } from 'react';
import { Image as ImageIcon, Upload, Check } from 'lucide-react';

export const ImageWidget: React.FC = () => {
  const [imageUrl, setImageUrl] = useState<string>(
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80'
  );
  const [isEditing, setIsEditing] = useState(false);
  const [tempUrl, setTempUrl] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageUrl(event.target.result as string);
          setIsEditing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyUrl = () => {
    if (tempUrl.trim()) {
      setImageUrl(tempUrl.trim());
      setIsEditing(false);
    }
  };

  return (
    <div className="flex flex-col p-1 text-hbs-slate-dark select-none h-full justify-between">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/40">
        <div className="flex items-center gap-1.5 text-xs font-black">
          <ImageIcon className="w-4 h-4 text-hbs-blue" />
          <span>Tafelbild</span>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-2 py-1 rounded-lg bg-white/70 hover:bg-white text-[10px] font-bold text-hbs-blue border border-white/80"
        >
          {isEditing ? 'Fertig' : 'Bild wechseln'}
        </button>
      </div>

      {isEditing ? (
        <div className="my-auto space-y-3 p-2 bg-white/60 rounded-2xl border border-white">
          <div>
            <label className="text-[10px] font-bold text-hbs-slate-muted block mb-1">Bild-URL einfügen:</label>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-2 py-1 text-xs rounded-xl bg-white border border-white font-bold"
              />
              <button
                onClick={handleApplyUrl}
                className="p-1.5 rounded-xl bg-hbs-blue text-white"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="text-center">
            <span className="text-[10px] font-bold text-hbs-slate-muted block mb-1.5">Oder Datei vom Gerät:</span>
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-xs font-bold text-hbs-slate-dark border border-slate-200 cursor-pointer shadow-2xs">
              <Upload className="w-3.5 h-3.5 text-hbs-blue" />
              <span>Bild hochladen</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>
      ) : (
        /* Image Display */
        <div className="flex-1 rounded-2xl overflow-hidden bg-black/10 border border-white shadow-inner flex items-center justify-center min-h-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Tafelbild"
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="text-xs font-bold text-hbs-slate-muted">Kein Bild geladen</span>
          )}
        </div>
      )}
    </div>
  );
};
