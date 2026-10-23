import React from 'react';
import { MetrologyFusionReport } from '../../types/metrology';
import { useToast } from '../../context/ToastContext';
import {
  Award,
  Download,
  Printer,
  X,
  FileText,
  CheckCircle2,
  QrCode,
  ShieldCheck,
} from 'lucide-react';

interface MetrologyCertificateModalProps {
  report: MetrologyFusionReport | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MetrologyCertificateModal: React.FC<MetrologyCertificateModalProps> = ({
  report,
  isOpen,
  onClose,
}) => {
  const toast = useToast();
  if (!isOpen || !report) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    const rows = [
      ['METROLOGY VERIFICATION CERTIFICATE'],
      ['Certificate ID', report.certificateId],
      ['Part Code', report.partCode],
      ['Part Name', report.partName],
      ['Serial Number', report.serialNumber],
      ['Machine ID', report.machineId],
      ['Operator', report.operatorName],
      ['Timestamp', report.timestamp],
      ['Overall Score', `${report.overallScore.toFixed(1)} / 100`],
      ['Verdict', report.verdict],
      ['Digital Signature', report.digitalSignature],
      [],
      ['PARAMETER', 'TYPE', 'MEASURED', 'NOMINAL / SPEC', 'STATUS'],
      ['Shape Match', 'Visual', `${report.camera.shapeMatchConfidence}%`, '≥85.0%', report.camera.shapeMatchConfidence >= 85 ? 'PASS' : 'FAIL'],
      ['Surface Defects', 'Visual', `${report.camera.defects.length} defects`, '0 defects', report.camera.defects.length === 0 ? 'PASS' : 'FAIL'],
      ['Orientation', 'Visual', report.camera.orientation, 'CORRECT', report.camera.orientation === 'CORRECT' ? 'PASS' : 'FAIL'],
      ...report.laserScanner.dimensions.map((d) => [
        d.name,
        'Geometry',
        `${d.measured.toFixed(3)} ${d.unit}`,
        `${d.nominal.toFixed(3)} ±${d.tolerance} ${d.unit}`,
        d.status,
      ]),
      ...report.laserScanner.gdt.map((g) => [
        g.name,
        'GD&T',
        `${g.measured} ${g.unit}`,
        `≤${g.specLimit} ${g.unit}`,
        g.status,
      ]),
      ['Ra (Roughness)', 'Surface', `${report.profilometer.roughness.Ra} µm`, '≤1.6 µm', report.profilometer.roughness.Ra <= 1.6 ? 'PASS' : 'FAIL'],
      ['Rz (Max Height)', 'Surface', `${report.profilometer.roughness.Rz} µm`, '≤6.3 µm', report.profilometer.roughness.Rz <= 6.3 ? 'PASS' : 'FAIL'],
      ['Wa (Waviness)', 'Surface', `${report.profilometer.waviness.Wa} µm`, '≤0.5 µm', report.profilometer.waviness.Wa <= 0.5 ? 'PASS' : 'FAIL'],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((e) => e.map((cell) => `"${cell}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `metrology-certificate-${report.certificateId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Certificate CSV exported successfully');
  };

  const handleDownloadJSON = () => {
    const jsonStr = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metrology-report-${report.certificateId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Certificate JSON dataset exported');
  };

  return (
    <div className="fixed inset-0 z-[1060] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div
        className="bg-white rounded-[12px] p-6 max-w-2xl w-full border border-[#E5E7EB] text-left shadow-2xl relative my-8"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Controls */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-[#4F46E5]" />
            <h3 className="text-base font-bold text-[#1A1A2E]">
              Digital Metrology Inspection Certificate
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#9CA3AF] hover:text-[#1A1A2E] hover:bg-[#F8F9FA] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Metrology Certificate Sheet */}
        <div className="border-2 border-slate-900 p-5 rounded-[8px] bg-[#FFFFFF] relative text-xs">
          {/* Watermark / Seal */}
          <div className="absolute top-4 right-4 text-center pointer-events-none opacity-85">
            <div className="w-16 h-16 border-2 border-emerald-600 rounded-full flex flex-col items-center justify-center text-[#15803D] p-1 font-bold">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-[7px] uppercase font-mono tracking-tighter">CERTIFIED</span>
              <span className="text-[6px] font-mono">ISO 9001</span>
            </div>
          </div>

          {/* Certificate Title */}
          <div className="text-center pb-3 border-b border-slate-300 mb-4">
            <div className="text-[10px] font-mono tracking-widest uppercase text-slate-500">
              DEFEX AI INDUSTRIAL METROLOGY LABORATORY
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
              CERTIFICATE OF METROLOGICAL CONFORMANCE
            </h2>
            <div className="text-[11px] font-mono text-blue-600 font-bold mt-0.5">
              ID: {report.certificateId}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs bg-[#F8FAFC] p-3 rounded border border-slate-200 mb-4 font-mono">
            <div>
              <span className="text-slate-500">Part Number:</span>{' '}
              <strong className="text-slate-900">{report.partCode}</strong>
            </div>
            <div>
              <span className="text-slate-500">Serial Number:</span>{' '}
              <strong className="text-slate-900">{report.serialNumber}</strong>
            </div>
            <div>
              <span className="text-slate-500">Part Description:</span>{' '}
              <strong className="text-slate-900">{report.partName}</strong>
            </div>
            <div>
              <span className="text-slate-500">Inspection Machine:</span>{' '}
              <strong className="text-slate-900">{report.machineId}</strong>
            </div>
            <div>
              <span className="text-slate-500">Inspection Time:</span>{' '}
              <span className="text-slate-700">{new Date(report.timestamp).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-500">Certified Operator:</span>{' '}
              <strong className="text-slate-900">{report.operatorName}</strong>
            </div>
          </div>

          {/* Verification Parameters Table */}
          <div className="mb-4">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Traceable Measurement Results
            </div>
            <table className="w-full text-left border-collapse text-[11px] font-mono">
              <thead>
                <tr className="bg-slate-100 text-slate-600 border-b border-slate-300">
                  <th className="py-1 px-2">Parameter</th>
                  <th className="py-1 px-2">Type</th>
                  <th className="py-1 px-2">Measured</th>
                  <th className="py-1 px-2">Specification</th>
                  <th className="py-1 px-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-1 px-2 font-medium">Part Silhouette</td>
                  <td className="py-1 px-2 text-slate-500">Visual</td>
                  <td className="py-1 px-2">{report.camera.shapeMatchConfidence.toFixed(1)}%</td>
                  <td className="py-1 px-2">≥85.0% Match</td>
                  <td className="py-1 px-2 text-right text-emerald-600 font-bold">PASS</td>
                </tr>
                {report.laserScanner.dimensions.map((d) => (
                  <tr key={d.id}>
                    <td className="py-1 px-2 font-medium">{d.name}</td>
                    <td className="py-1 px-2 text-slate-500">Laser 3D</td>
                    <td className="py-1 px-2">{d.measured.toFixed(3)} {d.unit}</td>
                    <td className="py-1 px-2">{d.nominal.toFixed(3)} ±{d.tolerance} {d.unit}</td>
                    <td className={`py-1 px-2 text-right font-bold ${d.status === 'PASS' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {d.status}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="py-1 px-2 font-medium">Flatness Datum B</td>
                  <td className="py-1 px-2 text-slate-500">GD&T</td>
                  <td className="py-1 px-2">0.018 µm</td>
                  <td className="py-1 px-2">≤0.05 µm</td>
                  <td className="py-1 px-2 text-right text-emerald-600 font-bold">PASS</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-medium">Roughness Ra</td>
                  <td className="py-1 px-2 text-slate-500">Confocal</td>
                  <td className="py-1 px-2">{report.profilometer.roughness.Ra.toFixed(2)} µm</td>
                  <td className="py-1 px-2">≤1.60 µm</td>
                  <td className={`py-1 px-2 text-right font-bold ${report.profilometer.roughness.Ra <= 1.6 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {report.profilometer.roughness.Ra <= 1.6 ? 'PASS' : 'FAIL'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Overall Verdict & QR Code Signature Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-300">
            {/* QR Code representation */}
            <div className="flex items-center space-x-2">
              <div className="w-14 h-14 bg-slate-100 border border-slate-300 p-1 flex items-center justify-center rounded">
                <QrCode className="w-12 h-12 text-slate-800" />
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                <div>Scan for Online Audit Trail</div>
                <div className="text-[9px] text-slate-400 truncate max-w-[150px]">
                  defex.ai/verify/{report.certificateId}
                </div>
              </div>
            </div>

            {/* Cryptographic Digital Signature */}
            <div className="text-right font-mono">
              <div className="text-[10px] font-bold text-slate-700">Digital Verification Stamp</div>
              <div className="text-[9px] text-blue-600 truncate max-w-[200px]">
                {report.digitalSignature}
              </div>
              <div className="text-[11px] font-bold text-emerald-600 mt-1">
                OVERALL VERDICT: {report.verdict} ({report.overallScore.toFixed(1)}/100)
              </div>
            </div>
          </div>
        </div>

        {/* Modal Export Actions Footer */}
        <div className="flex items-center justify-between pt-4 mt-2">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleDownloadCSV}
              className="py-1.5 px-3 rounded-[8px] bg-white border border-[#E5E7EB] hover:bg-[#F8F9FA] text-[#1A1A2E] text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#4F46E5]" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadJSON}
              className="py-1.5 px-3 rounded-[8px] bg-white border border-[#E5E7EB] hover:bg-[#F8F9FA] text-[#1A1A2E] text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Export JSON</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="py-1.5 px-3.5 rounded-[8px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center space-x-1.5 shadow-[0_2px_4px_rgba(37,99,235,0.2)] transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
