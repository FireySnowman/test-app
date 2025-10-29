
import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Point, Path } from '../types';

interface CanvasProps {
  strokeColor: string;
  strokeWidth: number;
  canvasColor: string;
}

const Canvas = forwardRef((props: CanvasProps, ref) => {
  const { strokeColor, strokeWidth, canvasColor } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<Path[]>([]);
  const [currentPath, setCurrentPath] = useState<Path | null>(null);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = canvasColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const pathsToDraw = currentPath ? [...history, currentPath] : history;

    pathsToDraw.forEach(path => {
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      if (path.points.length > 0) {
        ctx.moveTo(path.points[0].x, path.points[0].y);
        path.points.forEach(point => {
          ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
      }
    });
  }, [history, currentPath, canvasColor]);
  
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const resizeObserver = new ResizeObserver(() => {
        const { width, height } = parent.getBoundingClientRect();
        canvas.width = width;
        canvas.height = height;
        redrawCanvas();
    });

    resizeObserver.observe(parent);

    return () => resizeObserver.disconnect();
  }, [redrawCanvas]);


  const getCoordinates = (event: MouseEvent | TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in event) {
      if (event.touches.length === 0) return null;
      return {
        x: event.touches[0].clientX - rect.left,
        y: event.touches[0].clientY - rect.top,
      };
    }
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const startDrawing = useCallback((event: MouseEvent | TouchEvent) => {
    event.preventDefault();
    const coords = getCoordinates(event);
    if (!coords) return;
    setIsDrawing(true);
    setCurrentPath({
      points: [coords],
      color: strokeColor,
      strokeWidth: strokeWidth,
    });
  }, [strokeColor, strokeWidth]);

  const draw = useCallback((event: MouseEvent | TouchEvent) => {
    if (!isDrawing) return;
    event.preventDefault();
    const coords = getCoordinates(event);
    if (!coords || !currentPath) return;

    setCurrentPath(prev => prev ? { ...prev, points: [...prev.points, coords] } : null);
  }, [isDrawing, currentPath]);

  const finishDrawing = useCallback(() => {
    if (!isDrawing || !currentPath) return;
    setIsDrawing(false);
    if (currentPath.points.length > 1) {
      setHistory(prev => [...prev, currentPath]);
    }
    setCurrentPath(null);
  }, [isDrawing, currentPath]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', finishDrawing);
    canvas.addEventListener('mouseleave', finishDrawing);

    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', finishDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', finishDrawing);
      canvas.removeEventListener('mouseleave', finishDrawing);

      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', finishDrawing);
    };
  }, [startDrawing, draw, finishDrawing]);


  useImperativeHandle(ref, () => ({
    clear: () => {
      setHistory([]);
      setCurrentPath(null);
    },
    undo: () => {
      setHistory(prev => prev.slice(0, -1));
      setCurrentPath(null);
    },
    getImageData: () => {
        const canvas = canvasRef.current;
        if (!canvas) return '';
        // Create a temporary canvas to draw only the history (committed paths)
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if(!tempCtx) return '';

        tempCtx.fillStyle = canvasColor;
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        history.forEach(path => {
            tempCtx.strokeStyle = path.color;
            tempCtx.lineWidth = path.strokeWidth;
            tempCtx.lineCap = 'round';
            tempCtx.lineJoin = 'round';
            tempCtx.beginPath();
            if (path.points.length > 0) {
              tempCtx.moveTo(path.points[0].x, path.points[0].y);
              path.points.forEach(point => tempCtx.lineTo(point.x, point.y));
              tempCtx.stroke();
            }
        });
        
        return tempCanvas.toDataURL('image/png');
    },
    loadFromHistory: (newHistory: Path[]) => {
      setHistory(newHistory);
      setCurrentPath(null);
    },
    loadImage: (imageUrl: string) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const img = new Image();
        img.onload = () => {
            setHistory([]); // Clear drawing history
            setCurrentPath(null);
            ctx.fillStyle = canvasColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            // We can't perfectly convert image back to paths, so we clear history.
            // A more advanced implementation might store the image as a special history item.
        };
        img.src = imageUrl;
    }
  }));

  return (
    <canvas ref={canvasRef} className="w-full h-full bg-slate-800 rounded-lg shadow-inner" />
  );
});

export default Canvas;
