import { useState } from "react";
import toast from "react-hot-toast";
import { FileDown, Loader2 } from "lucide-react";

// Prominent PDF button used by every tab. `onDownload` is the generator to call
// (generateReport / generateSymptomReport) so this component stays tiny and reusable.
const DownloadReportButton = ({ onDownload }) => {
  const [busy, setBusy] = useState(false);

  const handleClick = () => {
    setBusy(true);
    try {
      onDownload();
      toast.success("Clinical report downloaded.");
    } catch (error) {
      console.error(error);
      toast.error("The report could not be generated. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-primary rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="text-white text-center sm:text-left">
        <p className="font-semibold text-lg">Clinical report ready</p>
        <p className="text-sm text-white/75">Includes your inputs, the screening outcome and the Explainable AI breakdown.</p>
      </div>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="flex items-center gap-2 bg-white text-primary font-semibold py-3 px-6 rounded-xl cursor-pointer hover:bg-secondary hover:text-white transition-colors disabled:opacity-60 shrink-0"
      >
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
        Download Clinical Report (PDF)
      </button>
    </div>
  );
};

export default DownloadReportButton;
