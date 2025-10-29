import React, { useState, useRef, useCallback } from 'react';
import { Path } from './types';
import Toolbar from './components/Toolbar';
import Canvas from './components/Canvas';

interface CanvasHandles {
  clear: () => void;
  undo: () => void;
  getImageData: () => string;
  loadFromHistory: (newHistory: Path[]) => void;
}

const App: React.FC = () => {
  const [color, setColor] = useState<string>('#FFFFFF');
  const [strokeWidth, setStrokeWidth] = useState<number>(5);
  const [isErasing, setIsErasing] = useState<boolean>(false);

  const canvasRef = useRef<CanvasHandles>(null);

  const handleClear = useCallback(() => {
    canvasRef.current?.clear();
  }, []);

  const handleUndo = useCallback(() => {
    canvasRef.current?.undo();
  }, []);

  const handleDownload = useCallback(() => {
    if (canvasRef.current) {
      const imageData = canvasRef.current.getImageData();
      const link = document.createElement('a');
      link.href = imageData;
      link.download = 'drawing.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, []);

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    setIsErasing(false);
  }

  const handleEraserSelect = () => {
    setIsErasing(true);
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-900 font-sans">
      <header className="flex-shrink-0 p-2 text-center bg-slate-800 shadow-md z-10">
        <h1 className="text-xl font-bold text-cyan-400">Drawing Pad</h1>
      </header>
      
      <main className="flex-grow flex flex-col md:flex-row-reverse overflow-hidden">
        <Toolbar
          color={color}
          setColor={handleColorChange}
          strokeWidth={strokeWidth}
          setStrokeWidth={setStrokeWidth}
          isErasing={isErasing}
          setIsErasing={handleEraserSelect}
          onClear={handleClear}
          onUndo={handleUndo}
          onDownload={handleDownload}
        />
        <div className="flex-grow w-full h-full p-2 md:p-4 relative">
          <Canvas
            ref={canvasRef}
            strokeColor={isErasing ? '#1e293b' : color} // bg-slate-800
            strokeWidth={strokeWidth}
            canvasColor="#1e293b"
          />
        </div>
      </main>
    </div>
  );
};

export default App;