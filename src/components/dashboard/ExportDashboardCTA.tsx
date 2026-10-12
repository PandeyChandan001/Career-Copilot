'use client';
import { Download } from 'lucide-react';

export function ExportDashboardCTA() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #results-dashboard, #results-dashboard * {
            visibility: visible;
          }
          #results-dashboard {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
          button, .no-print {
            display: none !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg text-xs font-medium transition-colors"
      >
        <Download size={14} />
        <span>Export PDF</span>
      </button>
    </>
  );
}
