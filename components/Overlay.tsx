import React, { useRef } from 'react';
import { TreeMorphState, HandData } from '../types';
import { processImageToPolaroid } from '../utils/imageProcessing';

interface OverlayProps {
  mode: TreeMorphState;
  setMode: (mode: TreeMorphState) => void;
  onImageUpload: (base64: string) => void;
  handData: HandData;
}

const Overlay: React.FC<OverlayProps> = ({ mode, setMode, onImageUpload, handData }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleMode = () => {
    setMode(mode === TreeMorphState.TREE_SHAPE ? TreeMorphState.SCATTERED : TreeMorphState.TREE_SHAPE);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await processImageToPolaroid(e.target.files[0]);
        onImageUpload(base64);
      } catch (err) {
        console.error("Image processing failed", err);
      }
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between z-10 p-6 sm:p-12">
      {/* Header */}
      <div className="pointer-events-auto flex justify-between items-start">
        <div>
          <h1 className="text-4xl sm:text-6xl text-amber-400 font-bold tracking-widest drop-shadow-lg" style={{ textShadow: '0 0 20px rgba(212, 175, 55, 0.5)' }}>
            ARIX
          </h1>
          <h2 className="text-lg sm:text-xl text-emerald-100 tracking-[0.3em] font-light mt-2 opacity-80">
            SIGNATURE COLLECTION
          </h2>
        </div>
        
        {/* Sensor Status */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border transition-all duration-500 ${handData.active ? 'bg-emerald-900/40 border-emerald-500/50' : 'bg-black/20 border-white/10'}`}>
           <div className={`w-2 h-2 rounded-full ${handData.active ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`} />
           <span className="text-xs tracking-widest text-emerald-100 font-cinzel">
             {handData.active ? 'HAND TRACKING ACTIVE' : 'AWAITING GESTURE'}
           </span>
        </div>
      </div>

      {/* Controls */}
      <div className="pointer-events-auto flex items-center gap-6 self-center sm:self-end mt-auto">
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
          className="hidden" 
          onChange={handleFileChange}
        />
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="group relative flex items-center justify-center w-14 h-14 bg-black/40 backdrop-blur-md border border-amber-500/30 rounded-full hover:bg-amber-500/10 transition-all duration-300"
          title="Upload Memory"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-200 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        <button
          onClick={toggleMode}
          className="relative px-8 py-3 bg-gradient-to-r from-amber-700/80 to-amber-900/80 backdrop-blur-md border border-amber-500/50 text-amber-100 font-serif tracking-widest text-sm rounded-sm hover:from-amber-600 hover:to-amber-800 transition-all duration-500 shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.6)]"
        >
          {mode === TreeMorphState.SCATTERED ? 'ASSEMBLE' : 'DISPERSE'}
        </button>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <div className="text-white/30 text-xs tracking-widest uppercase mb-1">
          Open Hand: Unleash • Closed Hand: Assemble
        </div>
        <div className="text-white/10 text-[10px] tracking-widest uppercase">
          Move hand to rotate view
        </div>
      </div>
    </div>
  );
};

export default Overlay;