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
          /* Hide interactive elements in print */
          button, .no-print {
            display: none !important;
          }
          /* Ensure backgrounds print */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />
      <button 
        onClick={handlePrint}
        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl font-bold transition-all active:scale-95 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]"
      >
        <Download size={16} />
        <span className="text-sm">Export Report</span>
      </button>
    </>
  );
}
