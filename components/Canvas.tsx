import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Point, Path } from '../types';

interface CanvasProps {
  strokeColor: string;
  strokeWidth: number;
  canvasColor: string;
}

/**
 * Draws a smoothed path on the canvas context.
 * For paths with 3 or more points, it uses quadratic Bézier curves.
 * For shorter paths, it draws straight lines.
 * @param ctx The canvas rendering context.
 * @param path The path to draw.
 */
const drawSmoothedPath = (ctx: CanvasRenderingContext2D, path: Path) => {
  ctx.strokeStyle = path.color;
  ctx.lineWidth = path.strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const { points } = path;
  if (points.length === 0) {
    return;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  if (points.length < 3) {
    // For short paths (1 or 2 points), just draw straight lines.
    // A single point will become a dot because of lineCap='round'.
    if (points.length > 1) {
      ctx.lineTo(points[1].x, points[1].y);
    } else {
      ctx.lineTo(points[0].x, points[0].y);
    }
  } else {
    // Use quadratic curves for smoothing longer paths.
    // We'll draw a curve from the current point to the midpoint of the next two points,
    // using the intermediate point as the control point.
    for (let i = 1; i < points.length - 2; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    // For the last segment, curve to the final point.
    ctx.quadraticCurveTo(
      points[points.length - 2].x,
      points[points.length - 2].y,
      points[points.length - 1].x,
      points[points.length - 1].y
    );
  }
  ctx.stroke();
};


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
      drawSmoothedPath(ctx, path);
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
            drawSmoothedPath(tempCtx, path);
        });
        
        return tempCanvas.toDataURL('image/png');
    },
    loadFromHistory: (newHistory: Path[]) => {
      setHistory(newHistory);
      setCurrentPath(null);
    }
  }));

  return (
    <canvas ref={canvasRef} className="w-full h-full bg-slate-800 rounded-lg shadow-inner" />
  );
});

export default Canvas;