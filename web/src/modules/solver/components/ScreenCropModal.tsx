import React, { useRef, useState, useEffect } from 'react';
import { Crop, X, Check } from 'lucide-react';

interface ScreenCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (base64Image: string) => void;
}

export const ScreenCropModal: React.FC<ScreenCropModalProps> = ({
  isOpen,
  onClose,
  onCropComplete,
}) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      startScreenCapture();
    } else {
      setCapturedImage(null);
      setStartPos(null);
      setCurrentPos(null);
    }
  }, [isOpen]);

  const startScreenCapture = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' } as any,
      });

      const video = document.createElement('video');
      video.srcObject = displayStream;
      await video.play();

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

      displayStream.getTracks().forEach((track) => track.stop());

      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setCapturedImage(dataUrl);
    } catch {
      onClose();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setStartPos({ x, y });
    setCurrentPos({ x, y });
    setIsSelecting(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    setCurrentPos({ x, y });
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
  };

  const handleConfirmCrop = () => {
    if (!capturedImage || !startPos || !currentPos || !imgRef.current) return;

    const img = imgRef.current;
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    const cropX = Math.min(startPos.x, currentPos.x) * scaleX;
    const cropY = Math.min(startPos.y, currentPos.y) * scaleY;
    const cropW = Math.abs(currentPos.x - startPos.x) * scaleX;
    const cropH = Math.abs(currentPos.y - startPos.y) * scaleY;

    if (cropW < 20 || cropH < 20) {
      // If crop too small, send full image
      onCropComplete(capturedImage);
      onClose();
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = cropW;
    canvas.height = cropH;
    const ctx = canvas.getContext('2d');
    const sourceImg = new Image();
    sourceImg.onload = () => {
      ctx?.drawImage(sourceImg, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.90);
      onCropComplete(croppedDataUrl);
      onClose();
    };
    sourceImg.src = capturedImage;
  };

  if (!isOpen || !capturedImage) return null;

  const getSelectionStyle = () => {
    if (!startPos || !currentPos) return { display: 'none' };
    const left = Math.min(startPos.x, currentPos.x);
    const top = Math.min(startPos.y, currentPos.y);
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);
    return { left, top, width, height };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white border border-slate-100 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Tarik Kotak Seleksi Soal</h3>
              <div className="text-[10px] text-slate-400">Pilih area teks atau rumus yang ingin diproses</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas & Crop Area */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="relative flex-1 overflow-auto flex items-center justify-center bg-slate-950 select-none cursor-crosshair"
        >
          <img
            ref={imgRef}
            src={capturedImage}
            alt="Captured Screen"
            className="max-h-[60vh] object-contain pointer-events-none"
          />

          {/* Selection Box */}
          {startPos && currentPos && (
            <div
              style={getSelectionStyle()}
              className="absolute border-2 border-blue-500 bg-blue-500/20 backdrop-blur-[1px] pointer-events-none"
            >
              <div className="absolute -top-6 left-0 bg-blue-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-sm">
                Wilayah Soal
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50">
          <span className="text-xs text-slate-500">
            Klik dan seret kursor untuk menandai bagian soal yang ingin diselesaikan.
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
            >
              Batal
            </button>
            <button
              onClick={handleConfirmCrop}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition active:scale-95"
            >
              <Check className="w-4 h-4" />
              Selesaikan Soal Terpilih
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
