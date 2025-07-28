import mermaid from "mermaid";
import { memo, useEffect, useId, useRef, useState } from "react";

interface MermaidDiagramProps {
  chart: string;
}

// Promise to track mermaid initialization state
let mermaidInitPromise: Promise<void> | null = null;

function initializeMermaid(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  // Return existing promise if initialization is already in progress or completed
  if (mermaidInitPromise) {
    return mermaidInitPromise;
  }

  // Create a new promise for initialization
  mermaidInitPromise = new Promise((resolve) => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      themeVariables: {
        primaryColor: "#1e293b",
        primaryTextColor: "#f1f5f9",
        primaryBorderColor: "#475569",
        lineColor: "#475569",
        secondaryColor: "#334155",
        tertiaryColor: "#1e293b",
        background: "#0f172a",
        mainBkg: "#1e293b",
        secondBkg: "#334155",
        tertiaryBkg: "#475569",
        textColor: "#f1f5f9",
        nodeTextColor: "#f1f5f9",
      },
    });
    resolve();
  });

  return mermaidInitPromise;
}

function isMermaidError(err: unknown): err is { message: string } {
  return typeof err === "object" && err !== null && "message" in err;
}

export const MermaidDiagram = memo(({ chart }: MermaidDiagramProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const uniqueId = useId().replace(/:/g, "_"); // React's useId includes colons, replace for valid HTML ID

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    // Reset error state for the new render cycle
    setError(null);

    // If the chart is empty, clear any previous diagram and stop
    if (!chart.trim()) {
      container.innerHTML = "";
      return;
    }

    let isCancelled = false;

    const renderDiagram = async () => {
      try {
        // Initialize mermaid on first render (only in browser)
        await initializeMermaid();

        // Use render() instead of run() for better control over IDs
        const { svg } = await mermaid.render(`mermaid-${uniqueId}`, chart);

        // Only update DOM if effect is still active
        if (!isCancelled) {
          container.innerHTML = svg;
        }
      } catch (err) {
        // Only update state if the effect is still active
        if (!isCancelled) {
          console.error("Mermaid rendering error:", err);
          setError(isMermaidError(err) ? err.message : "Failed to render diagram");
          // Clear any partial rendering
          container.innerHTML = "";
        }
      }
    };

    renderDiagram();

    // Cleanup function to run when the component unmounts or chart changes
    return () => {
      isCancelled = true;
    };
  }, [chart, uniqueId]);

  if (error) {
    return (
      <div className="my-4 px-4 bg-red-900/20 border border-red-500 rounded">
        <p className="text-red-400 text-sm">Failed to render Mermaid diagram:</p>
        <pre className="text-red-300 text-xs mt-2 overflow-x-auto">{error}</pre>
      </div>
    );
  }

  return (
    <div
      className="mermaid my-4 overflow-x-auto"
      ref={containerRef}
      id={`mermaid-container-${uniqueId}`}
      style={{
        // Ensure proper isolation and prevent overlapping
        position: "relative",
        isolation: "isolate",
        contain: "layout style",
        // Prevent SVG overflow issues
        maxWidth: "100%",
      }}
    />
  );
});
