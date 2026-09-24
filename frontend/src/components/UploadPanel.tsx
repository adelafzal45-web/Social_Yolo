"use client";

import React, { useRef, useState } from "react";
import { RemoveBackgroundOptions } from "../lib/api";

interface UploadPanelProps {
  onStartProcessing: (file: File, options: RemoveBackgroundOptions) => void;
  onError: (msg: string) => void;
}

export const UploadPanel: React.FC<UploadPanelProps> = ({
  onStartProcessing,
  onError,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [provider, setProvider] = useState<string>("imgly");
  const [model, setModel] = useState<"small" | "medium" | "large">("medium");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = (file: File) => {
    setSelectedFile(null);
    const validMimes = ["image/jpeg", "image/png", "image/webp"];
    if (!validMimes.includes(file.type)) {
      onError(
        `Invalid file type "${file.type}". Please upload JPEG, PNG, or WebP.`,
      );
      return;
    }

    if (file.size === 0) {
      onError("This file is empty. Please choose an image.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      onError("File exceeds 10 MB size limit.");
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleProcessClick = () => {
    if (!selectedFile) return;
    onStartProcessing(selectedFile, { provider, model });
  };

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
            🖼️ Upload Photo
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Create a transparent cutout with cleaner edges.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <label
              style={{ fontSize: "13px", color: "var(--text-muted)" }}
              htmlFor="provider"
            >
              Provider:
            </label>
            <select
              className="input-field"
              style={{ margin: 0, width: "auto", padding: "8px 12px" }}
              id="provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            >
              <option value="imgly">IMG.LY (Local AI ONNX)</option>
              <option value="bria">BRIA RMBG (Cloud Fallback)</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <label
              style={{ fontSize: "13px", color: "var(--text-muted)" }}
              htmlFor="model"
            >
              Model Tier:
            </label>
            <select
              className="input-field"
              style={{ margin: 0, width: "auto", padding: "8px 12px" }}
              id="model"
              disabled={provider === "bria"}
              value={model}
              onChange={(e) => setModel(e.target.value as any)}
            >
              <option value="small">Small (Fastest)</option>
              <option value="medium">Medium (Default / Offline)</option>
              <option value="large">
                Large (Requires asset setup / download)
              </option>
            </select>
          </div>
        </div>
      </div>

      <div
        className={`dropzone${isDragOver ? " dragover" : ""}`}
        role="button"
        tabIndex={0}
        aria-label="Choose an image to upload"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept="image/jpeg,image/png,image/webp"
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFile(e.target.files[0]);
            }
          }}
        />
        <div className="dropzone-icon">📁</div>
        <h3 style={{ fontSize: "16px", marginBottom: "6px" }}>
          Drag & Drop photo here, or click to browse
        </h3>
        <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
          Supports JPEG, PNG, WebP up to 10 MB. High-resolution & transparent
          inputs supported.
        </p>
      </div>

      {selectedFile && (
        <div
          style={{
            marginTop: "20px",
            background: "#0f172a",
            padding: "16px",
            borderRadius: "10px",
            border: "1px solid var(--surface-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: "14px" }}>
              {selectedFile.name}
            </div>
            <div
              style={{
                color: "var(--text-muted)",
                fontSize: "12px",
                marginTop: "2px",
              }}
            >
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB •{" "}
              {selectedFile.type}
            </div>
          </div>
          <button onClick={handleProcessClick}>
            <span>Remove Background & Refine ✨</span>
          </button>
        </div>
      )}
    </div>
  );
};
