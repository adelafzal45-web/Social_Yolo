'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Palette,
  Building2,
  Type,
  Users,
  Share2,
  ExternalLink,
  Layers,
  Copy,
  Check,
  RefreshCw,
  Clock,
  Tag,
  ShieldCheck,
} from 'lucide-react';
import { getBrandFullApi, reanalyzeBrandApi } from '@/lib/api';
import { BrandProfile, BrandInsight, BrandSource } from '@/lib/types';
import { useNotification } from '@/context/NotificationContext';

interface BrandDnaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  brand: BrandProfile | null;
  onReanalyzeRequested?: (brand: BrandProfile) => void;
}

export const BrandDnaDrawer: React.FC<BrandDnaDrawerProps> = ({
  isOpen,
  onClose,
  brand,
  onReanalyzeRequested,
}) => {
  const { toast } = useNotification();
  const [loading, setLoading] = useState(false);
  const [fullBrand, setFullBrand] = useState<BrandProfile | null>(null);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && brand?.id) {
      setFullBrand(brand);
      setLoading(true);
      getBrandFullApi(brand.id)
        .then((data) => {
          setFullBrand(data);
        })
        .catch((err) => {
          console.warn('Could not fetch full brand details:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setFullBrand(null);
    }
  }, [isOpen, brand?.id]);

  if (!isOpen || !brand) return null;

  const b = fullBrand || brand;
  const insight: BrandInsight | undefined = b.insight || undefined;
  const sources: BrandSource[] = b.sources || [];

  const copyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    toast.info(`Color code ${hex} copied to clipboard!`, 'Palette Copied');
    setTimeout(() => setCopiedColor(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-zinc-950 border-l border-zinc-800 h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800/80 bg-zinc-900/50">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl p-1 bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden"
              style={{ borderColor: (b.primaryColor || '#7c5cff') + '40' }}
            >
              {b.logoUrl || b.faviconUrl ? (
                <img
                  src={b.logoUrl || b.faviconUrl || ''}
                  alt={b.brandName}
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    (e.target as any).style.display = 'none';
                  }}
                />
              ) : (
                <Building2 className="w-6 h-6 text-zinc-400" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {b.brandName}
                </h2>
                {b.isDefault && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    Default
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                <span>{b.industry || 'General Industry'}</span>
                {b.websiteUrl && (
                  <>
                    <span>•</span>
                    <a
                      href={b.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-400 hover:underline flex items-center gap-0.5"
                    >
                      <span>Website</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-8 text-zinc-500 text-xs gap-2">
              <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <span>Loading complete Brand DNA...</span>
            </div>
          )}

          {/* Tagline / Value Proposition Banner */}
          {(b.tagline || insight?.valueProposition) && (
            <div
              className="p-4 rounded-2xl bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 relative overflow-hidden"
              style={{ borderColor: (b.primaryColor || '#7c5cff') + '30' }}
            >
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-15"
                style={{ backgroundColor: b.primaryColor || '#7c5cff' }}
              />
              <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block mb-1">
                Brand Core & Purpose
              </span>
              {b.tagline && (
                <p className="text-sm font-semibold text-white mb-1.5">
                  "{b.tagline}"
                </p>
              )}
              {insight?.valueProposition && (
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {insight.valueProposition}
                </p>
              )}
            </div>
          )}

          {/* Color Palette Swatches */}
          <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              <span>Visual Color Palette</span>
            </h3>

            <div className="grid grid-cols-3 gap-2.5 mb-3">
              {[
                { label: 'Primary', color: b.primaryColor || '#7c5cff' },
                { label: 'Secondary', color: b.secondaryColor || '#e0aa4e' },
                { label: 'Accent', color: b.accentColor || '#3ecf8e' },
              ].map((swatch) => (
                <button
                  key={swatch.label}
                  onClick={() => copyHex(swatch.color)}
                  className="p-2 rounded-xl bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 text-left transition-all group"
                >
                  <div
                    className="w-full h-8 rounded-lg mb-1.5 shadow-sm border border-black/20 relative"
                    style={{ backgroundColor: swatch.color }}
                  >
                    {copiedColor === swatch.color && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg text-white">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400 block font-medium">
                    {swatch.label}
                  </span>
                  <span className="text-xs font-mono font-bold text-white group-hover:text-purple-300 block">
                    {swatch.color}
                  </span>
                </button>
              ))}
            </div>

            {b.secondaryColors && b.secondaryColors.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-zinc-800/60">
                {b.secondaryColors.map((hex, idx) => (
                  <button
                    key={hex + idx}
                    onClick={() => copyHex(hex)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400 hover:text-white"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: hex }}
                    />
                    <span>{hex}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Typography & Tone */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <h4 className="text-[11px] font-bold text-zinc-400 uppercase mb-2 flex items-center gap-1.5">
                <Type className="w-3 h-3 text-indigo-400" />
                <span>Typography</span>
              </h4>
              <p className="text-xs text-white font-semibold">
                {b.fontHeading || 'Plus Jakarta Sans'}
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Body: {b.fontBody || 'Inter'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <h4 className="text-[11px] font-bold text-zinc-400 uppercase mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Tone & Voice</span>
              </h4>
              <p className="text-xs text-white font-semibold">{b.tone || 'Prestigious'}</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {insight?.brandVoice?.formality ? `Formality: ${insight.brandVoice.formality}` : 'Adaptive'}
              </p>
            </div>
          </div>

          {/* Products & Services */}
          {insight?.products && insight.products.length > 0 && (
            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Products & Offerings ({insight.products.length})</span>
              </h3>
              <div className="space-y-2">
                {insight.products.map((prod, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800/80 text-xs"
                  >
                    <span className="font-bold text-white block">{prod.name}</span>
                    {prod.description && (
                      <span className="text-[11px] text-zinc-400 block mt-0.5">
                        {prod.description}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Keywords / Content DNA */}
          {insight?.keywords && insight.keywords.length > 0 && (
            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                <span>Content & SEO Keywords</span>
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {insight.keywords.map((kw, i) => (
                  <span
                    key={kw + i}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 font-medium"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Crawled Sources */}
          {sources.length > 0 && (
            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Analyzed Website Sources ({sources.length})</span>
              </h3>
              <div className="space-y-1.5">
                {sources.map((s, idx) => (
                  <div
                    key={s.url + idx}
                    className="p-2 rounded-xl bg-zinc-900 border border-zinc-800/60 text-xs flex items-center justify-between"
                  >
                    <span className="text-zinc-300 font-mono text-[11px] truncate mr-2">
                      {s.url}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-zinc-800 text-purple-300 border border-purple-500/20 uppercase flex-shrink-0">
                      {s.pageType || 'PAGE'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-5 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-between gap-3">
          {b.websiteUrl && onReanalyzeRequested && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onReanalyzeRequested(b);
              }}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-sync Website</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="ml-auto px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition-all shadow-md shadow-purple-600/20"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
