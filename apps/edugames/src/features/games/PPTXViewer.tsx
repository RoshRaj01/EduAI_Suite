// PPTX Viewer Component
// Displays PowerPoint presentations using Office Web Viewer API with fallback options
import React, { useState, useEffect } from "react";
import { AlertCircle, Loader2, Download, ExternalLink } from "lucide-react";

interface PPTXViewerProps {
  fileUrl: string;
  fileName?: string;
  title?: string;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

/**
 * PPTXViewer Component
 *
 * Uses Office Web Viewer API for PPTX rendering (Microsoft's official solution)
 * Provides fallback options if embedding fails
 */
const PPTXViewer: React.FC<PPTXViewerProps> = ({
  fileUrl,
  fileName = "presentation.pptx",
  title = "Presentation",
  onLoad,
  onError,
}) => {
  const [viewerType, setViewerType] = useState<"office" | "fallback">("office");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"embed" | "download">("embed");

  useEffect(() => {
    // Simulate load completion after iframe is ready
    const timer = setTimeout(() => {
      setLoading(false);
      onLoad?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onLoad]);

  const handleIframeError = () => {
    setError(
      "Failed to load presentation viewer. Try downloading the file instead.",
    );
    setViewerType("fallback");
    onError?.("Iframe load failed");
  };

  // Office Web Viewer API URL - most reliable for PPTX
  const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;

  // Fallback viewer URL using Google Viewer
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between flex-shrink-0">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-sm text-slate-400">{fileName}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Selector */}
          <div className="flex gap-2 bg-slate-700 p-1 rounded">
            <button
              onClick={() => setViewMode("embed")}
              className={`px-3 py-1 text-sm rounded transition ${
                viewMode === "embed"
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              View
            </button>
            <button
              onClick={() => setViewMode("download")}
              className={`px-3 py-1 text-sm rounded transition ${
                viewMode === "download"
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Download
            </button>
          </div>

          {/* Download Button */}
          <a
            href={fileUrl}
            download={fileName}
            className="p-2 hover:bg-slate-700 rounded transition"
            title="Download presentation"
          >
            <Download className="w-5 h-5" />
          </a>

          {/* External Link */}
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-slate-700 rounded transition"
            title="Open in new tab"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/50 border-b border-red-700 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Viewer Error</p>
            <p className="text-sm text-slate-200 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Viewer Container */}
      <div className="flex-1 relative bg-black overflow-auto">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-slate-300">Loading presentation...</p>
            </div>
          </div>
        )}

        {viewMode === "embed" ? (
          <div className="w-full h-full flex items-center justify-center p-4">
            {viewerType === "office" ? (
              <iframe
                src={officeViewerUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                onError={handleIframeError}
                onLoad={() => {
                  setLoading(false);
                  onLoad?.();
                }}
                style={{ maxWidth: "1200px", margin: "0 auto" }}
                title={title}
              />
            ) : (
              // Fallback viewer
              <iframe
                src={googleViewerUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                onLoad={() => setLoading(false)}
                title={`${title} (Fallback Viewer)`}
                style={{ maxWidth: "1200px", margin: "0 auto" }}
              />
            )}
          </div>
        ) : (
          // Download mode
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Download className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                Download Presentation
              </h3>
              <p className="text-slate-400 mb-6">
                To view this presentation offline, download the file below.
              </p>
              <a
                href={fileUrl}
                download={fileName}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition font-medium"
              >
                <Download className="w-5 h-5" />
                Download {fileName}
              </a>
              <p className="text-sm text-slate-500 mt-4">
                Or{" "}
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300"
                >
                  view online
                </a>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Info Bar */}
      <div className="bg-slate-800 border-t border-slate-700 px-4 py-2 text-xs text-slate-400 flex-shrink-0">
        {viewerType === "office" ? (
          <span>✓ Powered by Microsoft Office Web Viewer</span>
        ) : (
          <span>⚠ Using fallback viewer. Download for full features.</span>
        )}
      </div>
    </div>
  );
};

export default PPTXViewer;
