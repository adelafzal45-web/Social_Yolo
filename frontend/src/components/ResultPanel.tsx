"use client";

import React, { useEffect, useState } from "react";
import { ProcessedImageResult } from "../lib/api";
import { QualityInspector } from "./QualityInspector";

interface ResultPanelProps {
  result: ProcessedImageResult;
  originalFile: File | null;
  onReset: () => void;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
  result,
  originalFile,
  onReset,
}) => {
  const downloadResult = () => {
    const a = document.createElement("a");
    a.href = result.file.url;
    const base = originalFile
      ? originalFile.name.replace(/\.[^.]+$/, "")
      : "image";
    a.download = `refined_${base}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!originalFile) {
      setOriginalUrl(null);
      return;
    }
    const url = URL.createObjectURL(originalFile);
    setOriginalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [originalFile]);

  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <div>
          <h2 style={{ fontSize: "20px", marginBottom: "4px" }}>
            {result.file.transparent
              ? "Background removal result"
              : "Result needs review"}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              className={
                result.file.transparent
                  ? "badge badge-success"
                  : "badge badge-warning"
              }
            >
              {result.file.transparent
                ? "Transparency detected"
                : "No transparency detected"}
            </span>
            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Completed in {(result.processingTimeMs / 1000).toFixed(1)}s
              (Engine: {result.provider})
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn-secondary" onClick={onReset}>
            Upload Another
          </button>
          <button onClick={downloadResult}>⬇ Download Transparent PNG</button>
        </div>
      </div>

      <div className="image-grid">
        <div className="image-card">
          <div className="image-card-header">
            <span>Original Input</span>
            <span
              style={{
                fontWeight: "normal",
                color: "var(--text-muted)",
                fontSize: "12px",
              }}
            >
              {originalFile
                ? `${originalFile.name} • ${(originalFile.size / 1024).toFixed(0)} KB`
                : ""}
            </span>
          </div>
          <div className="checkerboard">
            {originalUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={originalUrl} alt="Original" />
            ) : (
              <div style={{ color: "var(--text-muted)" }}>
                Original Preview Unavailable
              </div>
            )}
          </div>
        </div>

        <div className="image-card">
          <div className="image-card-header">
            <span style={{ color: "#a78bfa" }}>Transparent PNG Cutout</span>
            <span
              style={{
                fontWeight: "normal",
                color: "var(--text-muted)",
                fontSize: "12px",
              }}
            >
              {result.file.width}×{result.file.height} •{" "}
              {((result.file.sizeBytes || 0) / 1024).toFixed(0)} KB • PNG
            </span>
          </div>
          <div className="checkerboard">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={result.file.url} alt="Processed Output" />
          </div>
        </div>
      </div>

      <QualityInspector result={result} />
    </div>
  );
};
