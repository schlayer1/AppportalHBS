import React, { useState } from 'react';
import { Video, Check, Edit2 } from 'lucide-react';

export const VideoWidget: React.FC = () => {
  const [videoUrlInput, setVideoUrlInput] = useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [embedSrc, setEmbedSrc] = useState('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0');
  const [isEditing, setIsEditing] = useState(false);

  const parseYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const handleApply = () => {
    const ytId = parseYouTubeId(videoUrlInput);
    if (ytId) {
      setEmbedSrc(`https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1`);
    } else {
      setEmbedSrc(videoUrlInput);
    }
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col p-1 text-hbs-slate-dark select-none h-full justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/40">
        <div className="flex items-center gap-1.5 text-xs font-black">
          <Video className="w-4 h-4 text-red-500" />
          <span>Unterrichts-Video</span>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-2 py-1 rounded-lg bg-white/70 hover:bg-white text-[10px] font-bold text-hbs-blue border border-white/80 flex items-center gap-1"
        >
          {isEditing ? <Check className="w-3 h-3" /> : <Edit2 className="w-3 h-3" />}
          <span>{isEditing ? 'Fertig' : 'Video ändern'}</span>
        </button>
      </div>

      {isEditing ? (
        <div className="my-auto p-3 bg-white/70 rounded-2xl border border-white space-y-2">
          <label className="text-[10px] font-bold text-hbs-slate-muted block">
            YouTube-Link oder Video-URL eingeben:
          </label>
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={videoUrlInput}
              onChange={(e) => setVideoUrlInput(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1 px-2.5 py-1.5 text-xs rounded-xl bg-white border border-white font-bold"
            />
            <button
              onClick={handleApply}
              className="px-3 py-1.5 rounded-xl bg-hbs-blue text-white text-xs font-bold"
            >
              Laden
            </button>
          </div>
          <span className="text-[10px] text-hbs-slate-muted block">
            Tipp: Läuft werbefrei und ohne Ablenkung im No-Cookie-Modus.
          </span>
        </div>
      ) : (
        /* Video Viewport */
        <div className="flex-1 rounded-2xl overflow-hidden bg-black border border-white shadow-inner min-h-0">
          <iframe
            src={embedSrc}
            title="Classroom Video Player"
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
};
