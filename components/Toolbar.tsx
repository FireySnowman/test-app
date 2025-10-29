
import React from 'react';
import { BrushIcon, EraserIcon, UndoIcon, ClearIcon, DownloadIcon, SparklesIcon } from './Icons';

interface ToolbarProps {
  color: string;
  setColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  isErasing: boolean;
  setIsErasing: () => void;
  onClear: () => void;
  onUndo: () => void;
  onDownload: () => void;
  onBeautify: () => void;
  isLoading: boolean;
}

const colors = [
  '#FFFFFF', '#EF4444', '#F97316', '#EAB308', 
  '#84CC16', '#22C55E', '#14B8A6', '#06B6D4',
  '#3B82F6', '#8B5CF6', '#EC4899', '#78716C'
];

const Toolbar: React.FC<ToolbarProps> = ({
  color,
  setColor,
  strokeWidth,
  setStrokeWidth,
  isErasing,
  setIsErasing,
  onClear,
  onUndo,
  onDownload,
  onBeautify,
  isLoading
}) => {
  return (
    <div className="flex-shrink-0 w-full md:w-64 bg-slate-800 p-4 flex flex-row md:flex-col items-center md:items-stretch gap-4 overflow-x-auto md:overflow-y-auto">
      {/* Group 1: Drawing tools */}
      <div className="p-3 bg-slate-700 rounded-lg">
        <h3 className="text-sm font-semibold mb-3 text-cyan-400">Brush</h3>
        <div className="flex items-center gap-2">
          <BrushIcon className="w-6 h-6 text-slate-400" />
          <input
            type="range"
            min="1"
            max="50"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm w-8 text-center">{strokeWidth}</span>
        </div>
      </div>

      {/* Group 2: Color Palette */}
      <div className="p-3 bg-slate-700 rounded-lg">
        <h3 className="text-sm font-semibold mb-3 text-cyan-400">Colors</h3>
        <div className="grid grid-cols-6 md:grid-cols-4 gap-2">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full transition-transform duration-150 transform hover:scale-110 ${color === c && !isErasing ? 'ring-2 ring-cyan-400' : ''}`}
              style={{ backgroundColor: c }}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
      </div>
      
      {/* Group 3: Actions */}
      <div className="p-3 bg-slate-700 rounded-lg flex flex-col gap-2">
        <h3 className="text-sm font-semibold mb-2 text-cyan-400">Actions</h3>
        <div className="grid grid-cols-2 gap-2">
            <ActionButton onClick={setIsErasing} label="Erase" active={isErasing}><EraserIcon/></ActionButton>
            <ActionButton onClick={onUndo} label="Undo"><UndoIcon/></ActionButton>
            <ActionButton onClick={onClear} label="Clear"><ClearIcon/></ActionButton>
            <ActionButton onClick={onDownload} label="Download"><DownloadIcon/></ActionButton>
        </div>
      </div>

      {/* Group 4: AI Action */}
      <div className="p-3 bg-slate-700 rounded-lg mt-auto">
        <button
          onClick={onBeautify}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-base font-semibold text-white bg-purple-600 rounded-lg shadow-md hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all duration-200"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Enhancing...</span>
            </>
          ) : (
            <>
              <SparklesIcon />
              Beautify
            </>
          )}
        </button>
      </div>

    </div>
  );
};

interface ActionButtonProps {
    onClick: () => void;
    label: string;
    children: React.ReactNode;
    active?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, label, children, active = false }) => (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`p-3 rounded-lg flex items-center justify-center transition-colors duration-200 ${
        active 
          ? 'bg-cyan-500 text-white' 
          : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
      }`}
    >
      {children}
    </button>
)

export default Toolbar;
