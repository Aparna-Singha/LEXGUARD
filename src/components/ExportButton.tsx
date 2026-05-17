'use client';

import { Printer, Download } from 'lucide-react';

interface ExportButtonProps {
  reportId: string;
}

export default function ExportButton({ reportId }: ExportButtonProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    try {
      const res = await fetch(`/api/report/${reportId}`);
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lexguard-report-${reportId.slice(0, 8)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="flex items-center gap-2 no-print">
      <button
        onClick={handlePrint}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-overlay hover:bg-border-light text-xs text-slate-300 transition-colors"
      >
        <Printer className="w-3.5 h-3.5" />
        Print
      </button>
      <button
        onClick={handleDownload}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-overlay hover:bg-border-light text-xs text-slate-300 transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        Export JSON
      </button>
    </div>
  );
}
