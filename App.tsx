
import React, { useState, useRef, useCallback } from 'react';
import { Path } from './types';
import Toolbar from './components/Toolbar';
import Canvas from './components/Canvas';
// import { beautifyDrawing } from './services/geminiService';

interface CanvasHandles {
  clear: () => void;
  undo: () => void;
  getImageData: () => string;
  loadFromHistory: (newHistory: Path[]) => void;
  loadImage: (imageUrl: string) => void;
}

const App: React.FC = () => {
  const [color, setColor] = useState<string>('#FFFFFF');
  const [strokeWidth, setStrokeWidth] = useState<number>(5);
  const [isErasing, setIsErasing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleBeautify = useCallback(async () => {
    if (!canvasRef.current) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const imageData = canvasRef.current.getImageData();
      if(imageData.length < 100) { // Simple check for blank canvas
        setError("Canvas is empty. Please draw something first.");
        setIsLoading(false);
        return;
      }
      const newImage = await beautifyDrawing(imageData);
      canvasRef.current.loadImage(newImage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
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
        <h1 className="text-xl font-bold text-cyan-400">AI Drawing Pad</h1>
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
          onBeautify={handleBeautify}
          isLoading={isLoading}
        />
        <div className="flex-grow w-full h-full p-2 md:p-4 relative">
          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/90 text-white p-3 rounded-lg shadow-lg z-20">
              <p>{error}</p>
              <button onClick={() => setError(null)} className="absolute top-0 right-1 text-lg">&times;</button>
            </div>
          )}
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
