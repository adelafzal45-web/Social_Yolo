"use client";

import React from "react";
import { ProcessedImageResult, Verdict } from "../lib/api";

interface QualityInspectorProps {
  result: ProcessedImageResult;
}

export const QualityInspector: React.FC<QualityInspectorProps> = ({
  result,
}) => {
  const {
    qualityReport,
    refinement,
    providerChain,
    fallbackUsed,
    provider,
    processingTimeMs = 0,
  } = result;

  if (!qualityReport && !refinement) {
    return null;
  }

  const getVerdictBadgeClass = (verdict: Verdict) => {
    switch (verdict) {
      case "OK":
        return "badge-success";
      case "POSSIBLE_REMNANT":
      case "LOW_CONFIDENCE":
        return "badge-warning";
      case "EMPTY_SUBJECT":
      case "NO_REMOVAL":
        return "badge-danger";
      default:
        return "badge-info";
    }
  };

  return (
    <div className="quality-panel">
      <div className="quality-header">
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: 600 }}>
            🔬 Matte Quality & Refinement Analysis
          </h3>
          <p
            style={{
              fontSize: "13px",
              color: "var(--text-muted)",
              marginTop: "2px",
            }}
          >
            Quality estimates from the model mask before refinement; inspect the
            preview for edge detail.
          </p>
        </div>

        {qualityReport && (
          <span
            className={`badge ${getVerdictBadgeClass(qualityReport.verdict)}`}
          >
            Verdict: {qualityReport.verdict}
          </span>
        )}
      </div>

      {qualityReport && (
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Subject Coverage</div>
            <div className="metric-value">
              {(qualityReport.coverage * 100).toFixed(1)}%
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Transition (% of subject)</div>
            <div className="metric-value">
              {(qualityReport.transitionBandFrac * 100).toFixed(1)}%
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Haze (% of subject)</div>
            <div className="metric-value">
              {(qualityReport.hazeFrac * 100).toFixed(1)}%
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Opaque Core</div>
            <div className="metric-value">
              {(qualityReport.opaqueFrac * 100).toFixed(1)}%
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Opaque Border</div>
            <div className="metric-value">
              {(qualityReport.borderOpaqueFrac * 100).toFixed(1)}%
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Alpha Range</div>
            <div className="metric-value">
              [{qualityReport.minAlpha} .. {qualityReport.maxAlpha}]
            </div>
          </div>
        </div>
      )}

      {qualityReport?.details && (
        <p
          style={{
            fontSize: "13px",
            color: "var(--text-muted)",
            marginBottom: "14px",
            fontStyle: "italic",
          }}
        >
          Analysis note: {qualityReport.details}
        </p>
      )}

      <div
        style={{
          borderTop: "1px solid var(--surface-border)",
          paddingTop: "14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              textTransform: "uppercase",
            }}
          >
            Provider Execution Chain
          </div>
          <div style={{ fontSize: "14px", fontWeight: 600, marginTop: "2px" }}>
            {(providerChain || [provider]).join(" ➔ ")}
            {fallbackUsed && (
              <span
                className="badge badge-warning"
                style={{ marginLeft: "8px", fontSize: "11px" }}
              >
                Fallback result selected
              </span>
            )}
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              textTransform: "uppercase",
            }}
          >
            Total Pipeline Latency
          </div>
          <div style={{ fontSize: "14px", fontWeight: 600, marginTop: "2px" }}>
            {(processingTimeMs / 1000).toFixed(2)}s
          </div>
        </div>

        {refinement && (
          <div style={{ width: "100%", marginTop: "6px" }}>
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
              }}
            >
              Refinement Stages Applied
            </div>
            <div className="stages-list">
              {refinement.stages && refinement.stages.length > 0 ? (
                refinement.stages.map((stage: string) => (
                  <span key={stage} className="stage-pill">
                    ⚡ {stage}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  None (Pass-through)
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
