'use client';

import { useCallback, useState, useRef } from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ACCEPTED_EXTENSIONS = ['.pdf', '.txt', '.docx'];
const MAX_SIZE_MB = 10;

export default function FileUpload({ onFileSelect, selectedFile, onClear }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): boolean => {
    setError(null);
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();

    if (!ACCEPTED_EXTENSIONS.includes(ext) && !ACCEPTED_TYPES.includes(file.type)) {
      setError(`Unsupported format "${ext}". Please upload PDF, DOCX, or TXT files.`);
      return false;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum is ${MAX_SIZE_MB}MB.`);
      return false;
    }

    return true;
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      if (validateFile(file)) {
        onFileSelect(file);
      }
    },
    [validateFile, onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (selectedFile) {
    return (
      <div className="animate-fade-in">
        <div className="glass rounded-xl p-5 flex items-center justify-between group hover:border-brand-500/30 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-brand-600/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-brand-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{selectedFile.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
          <button
            onClick={() => {
              onClear();
              setError(null);
              if (inputRef.current) inputRef.current.value = '';
            }}
            className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
            aria-label="Remove file"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`drop-zone relative cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all ${
          isDragging
            ? 'drag-over border-brand-400'
            : 'border-border-light hover:border-brand-500/40 hover:bg-brand-500/5'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.docx"
          onChange={handleInputChange}
          className="hidden"
          id="file-upload"
        />
        <div className="flex flex-col items-center gap-3">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
            isDragging ? 'bg-brand-500/20' : 'bg-surface-overlay'
          }`}>
            <Upload className={`w-6 h-6 transition-colors ${isDragging ? 'text-brand-400' : 'text-slate-400'}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">
              {isDragging ? 'Drop your document here' : 'Drag & drop your document here'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              or <span className="text-brand-400 hover:text-brand-300">browse files</span>
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {['PDF', 'DOCX', 'TXT'].map((fmt) => (
              <span
                key={fmt}
                className="px-2 py-0.5 rounded text-[10px] font-medium bg-surface-overlay text-slate-400 uppercase tracking-wider"
              >
                {fmt}
              </span>
            ))}
            <span className="text-[10px] text-slate-600">Max {MAX_SIZE_MB}MB</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}
    </div>
  );
}
