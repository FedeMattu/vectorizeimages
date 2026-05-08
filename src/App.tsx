import { useState, useRef, useCallback } from 'react';
import ImageTracer from 'imagetracerjs';
import { Upload, Download, Layers, Image as ImageIcon, Zap } from 'lucide-react';

type DetailLevel = 1 | 2 | 3 | 4;

const PRESETS: Record<DetailLevel, { name: string; desc: string; opts: Record<string, any> }> = {
  1: { name: 'Low', desc: 'Few vectors', opts: { pathomit: 20, ltres: 2, qtres: 2, numberofcolors: 8 } },
  2: { name: 'Medium', desc: 'Balanced', opts: { pathomit: 8, ltres: 1, qtres: 1, numberofcolors: 16 } },
  3: { name: 'High', desc: 'More vectors', opts: { pathomit: 3, ltres: 0.5, qtres: 0.5, numberofcolors: 32 } },
  4: { name: 'Ultra', desc: 'Max detail', opts: { pathomit: 0, ltres: 0.1, qtres: 0.1, numberofcolors: 64 } },
};

function App() {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [svgString, setSvgString] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailLevel>(2);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const traceImage = useCallback((src: string, level: DetailLevel) => {
    setLoading(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const maxDim = 1200;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > maxDim || h > maxDim) {
        if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
        else { w = Math.round((w * maxDim) / h); h = maxDim; }
      }
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      const imgd = ctx.getImageData(0, 0, w, h);
      const preset = PRESETS[level];
      const opts = { ...preset.opts, scale: 1, roundcoords: 2, viewbox: true };
      try {
        const svg = ImageTracer.imagedataToSVG(imgd, opts);
        setSvgString(svg);
      } catch (e) {
        console.error(e);
        alert('Error during tracing');
      } finally {
        setLoading(false);
      }
    };
    img.onerror = () => {
      setLoading(false);
      alert('Failed to load image');
    };
    img.src = src;
  }, []);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setImgSrc(src);
      traceImage(src, detail);
    };
    reader.readAsDataURL(file);
  }, [detail, traceImage]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const onChangeDetail = useCallback((level: DetailLevel) => {
    setDetail(level);
    if (imgSrc) {
      traceImage(imgSrc, level);
    }
  }, [imgSrc, traceImage]);

  const downloadSVG = () => {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vectorized.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-full flex flex-col bg-void-950 text-slate-200">
      <header className="border-b border-void-700/60 bg-void-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-violet-450 text-white p-1.5 rounded-lg">
              <Layers size={20} />
            </div>
            <h1 className="font-bold text-lg tracking-tight">vector-ize</h1>
          </div>
          <div className="text-xs text-violet-350 font-medium">Image → SVG</div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {!imgSrc && (
          <div className="text-center py-20">
            <h2 className="text-3xl font-bold mb-3">Convert images to SVG vectors</h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">Drop an image below to trace it into a scalable vector graphic. Adjust detail level with 4 presets.</p>
          </div>
        )}

        <div
          className="border-2 border-dashed border-void-700 hover:border-violet-450 rounded-2xl p-10 text-center transition-colors cursor-pointer bg-void-900/50"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => document.getElementById('fileInput')?.click()}
        >
          <input
            id="fileInput"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div className="mx-auto bg-void-800 w-14 h-14 rounded-xl flex items-center justify-center mb-4 text-violet-350">
            <Upload size={24} />
          </div>
          <p className="font-medium text-slate-300">Click or drop an image here</p>
          <p className="text-xs text-slate-500 mt-1">JPG, PNG, WEBP, GIF</p>
        </div>

        {imgSrc && (
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <div className="bg-void-900 rounded-2xl p-4 border border-void-700/50">
              <div className="flex items-center gap-2 mb-3 text-sm font-medium text-slate-400">
                <ImageIcon size={16} />
                Original
              </div>
              <img src={imgSrc} alt="Original" className="rounded-xl w-full object-contain max-h-80 bg-void-950" />
            </div>

            <div className="bg-void-900 rounded-2xl p-4 border border-void-700/50 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
                  <Zap size={16} className="text-violet-350" />
                  Vector
                </div>
                <div className="flex items-center gap-1 bg-void-800 rounded-lg p-1">
                  {([1, 2, 3, 4] as DetailLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => onChangeDetail(lvl)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        detail === lvl
                          ? 'bg-violet-450 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {PRESETS[lvl].name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center bg-void-950 rounded-xl p-4 min-h-[16rem] overflow-hidden">
                {loading ? (
                  <div className="flex flex-col items-center gap-3 text-slate-500">
                    <div className="w-8 h-8 border-2 border-violet-450 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Tracing vectors...</span>
                  </div>
                ) : svgString ? (
                  <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`} alt="Vectorized" className="max-w-full max-h-full object-contain" />
                ) : (
                  <span className="text-sm text-slate-600">No result</span>
                )}
              </div>

              {svgString && (
                <button
                  onClick={downloadSVG}
                  className="mt-4 w-full bg-violet-450 hover:bg-violet-500 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Download size={18} />
                  Download SVG
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      <canvas ref={canvasRef} className="hidden" />

      <footer className="border-t border-void-700/60 py-4 text-center text-xs text-slate-600">
        Built with React & ImageTracerJS
      </footer>
    </div>
  );
}

export default App;
