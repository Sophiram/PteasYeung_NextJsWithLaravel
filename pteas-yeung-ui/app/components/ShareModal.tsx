'use client';

import React, { useState, useEffect } from 'react';
import {
  Share2, Copy, Check, QrCode, X, Sparkles,
  Mail, Globe, Smartphone
} from 'lucide-react';
import toast from 'react-hot-toast';

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  url?: string;
  currentLang?: 'kh' | 'en';
}

// Brand SVG Icons
const TelegramIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z"/>
  </svg>
);

const FacebookIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const WhatsAppIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.031 0C5.395 0 .012 5.385.012 12.02c0 2.118.552 4.186 1.6 6.008L0 24l6.155-1.614a11.96 11.96 0 0 0 5.876 1.53h.005c6.634 0 12.017-5.385 12.017-12.021 0-3.21-1.25-6.226-3.523-8.5a11.94 11.94 0 0 0-8.499-3.522zm0 2.003c5.524 0 10.015 4.492 10.015 10.018 0 2.673-1.042 5.186-2.935 7.08-1.894 1.894-4.407 2.937-7.08 2.937h-.005a9.96 9.96 0 0 1-5.074-1.39l-.364-.216-3.77.989 1.006-3.673-.238-.378a9.96 9.96 0 0 1-1.54-5.349C2.016 6.495 6.507 2.003 12.031 2.003zm-2.83 5.485c-.156 0-.41.059-.625.293-.215.234-.82.8-.82 1.954 0 1.152.84 2.266.957 2.422.117.156 1.621 2.535 3.978 3.528.56.236.997.377 1.338.484.563.178 1.076.153 1.481.093.452-.068 1.387-.567 1.582-1.114.195-.547.195-1.016.137-1.114-.059-.097-.215-.156-.45-.273-.234-.117-1.387-.684-1.602-.762-.215-.078-.371-.117-.527.117-.156.234-.605.762-.742.918-.137.156-.273.176-.508.059-.234-.117-.99-.365-1.886-1.164-.697-.622-1.168-1.39-1.305-1.625-.137-.234-.015-.36.103-.477.106-.105.234-.273.352-.41.117-.137.156-.234.234-.39.078-.156.039-.293-.02-.41-.059-.117-.527-1.27-.723-1.74-.19-.456-.385-.394-.527-.401-.136-.007-.293-.008-.449-.008z"/>
  </svg>
);

const XTwitterIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const LinkedInIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v7.6h2.8v-7.6h-2.8M7.86 6.32a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28z"/>
  </svg>
);

const t = {
  kh: {
    modalTitle: 'ចែករំលែកវេទិកាផ្ទះយើង',
    modalSubtitle: 'អ្នកណាក៏ដោយដែលមានតំណភ្ជាប់នេះ អាចចូលមើលបន្ទប់ជួល និងព័ត៌មានអចលនទ្រព្យបានភ្លាមៗ។',
    copyLink: 'ចម្លងតំណភ្ជាប់',
    copied: 'បានចម្លងរួចរាល់!',
    copySuccessToast: 'បានចម្លងតំណភ្ជាប់ទៅក្ដារតម្បៀតខ្ទាស់!',
    shareViaSocial: 'ឬចែករំលែកដោយផ្ទាល់ទៅកាន់៖',
    scanQr: 'ស្កេន QR Code',
    hideQr: 'លាក់ QR Code',
    qrSubtitle: 'ស្កេនដោយកាមេរ៉ាទូរស័ព្ទដៃ ដើម្បីបើកគេហទំព័រនេះភ្លាមៗ',
    nativeShare: 'កម្មវិធីផ្សេងៗ',
    shareHeading: 'ចែករំលែក',
    shareText: 'ស្វែងរក និងគ្រប់គ្រងបន្ទប់ជួលឆ្លាតវៃជាមួយ Pteas Yeung (ផ្ទះយើង)!',
  },
  en: {
    modalTitle: 'Share Pteas Yeung Platform',
    modalSubtitle: 'Anyone with this link will be able to view available rooms and platform services.',
    copyLink: 'Copy Link',
    copied: 'Copied!',
    copySuccessToast: 'Link copied to clipboard!',
    shareViaSocial: 'Or share directly via:',
    scanQr: 'Scan QR Code',
    hideQr: 'Hide QR Code',
    qrSubtitle: 'Point your camera at this QR code to open instantly on mobile',
    nativeShare: 'More Apps',
    shareHeading: 'Share',
    shareText: 'Discover and manage smart rental rooms with Pteas Yeung Platform!',
  }
};

export default function ShareModal({
  isOpen,
  onClose,
  title,
  description,
  url,
  currentLang = 'kh'
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const lang = t[currentLang] || t.kh;
  const modalTitle = title || lang.modalTitle;
  const modalDescription = description || lang.modalSubtitle;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(url || window.location.href);
    }
  }, [url, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      toast.success(lang.copySuccessToast, { icon: '📋' });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Could not copy link');
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: modalTitle,
          text: lang.shareText,
          url: shareUrl,
        });
      } catch {
        // User dismissed or aborted share
      }
    } else {
      handleCopyLink();
    }
  };

  const socialPlatforms = [
    {
      name: 'Telegram',
      icon: TelegramIcon,
      color: 'hover:bg-[#229ED9] hover:text-white border-slate-700/80 bg-[#229ED9]/10 text-[#229ED9]',
      shareLink: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(lang.shareText)}`
    },
    {
      name: 'WhatsApp',
      icon: WhatsAppIcon,
      color: 'hover:bg-[#25D366] hover:text-white border-slate-700/80 bg-[#25D366]/10 text-[#25D366]',
      shareLink: `https://api.whatsapp.com/send?text=${encodeURIComponent(lang.shareText + ' ' + shareUrl)}`
    },
    {
      name: 'Facebook',
      icon: FacebookIcon,
      color: 'hover:bg-[#1877F2] hover:text-white border-slate-700/80 bg-[#1877F2]/10 text-[#1877F2]',
      shareLink: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    },
    {
      name: 'X (Twitter)',
      icon: XTwitterIcon,
      color: 'hover:bg-slate-100 hover:text-slate-900 border-slate-700/80 bg-slate-800 text-slate-200',
      shareLink: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(lang.shareText)}`
    },
    {
      name: 'LinkedIn',
      icon: LinkedInIcon,
      color: 'hover:bg-[#0A66C2] hover:text-white border-slate-700/80 bg-[#0A66C2]/10 text-[#0A66C2]',
      shareLink: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'hover:bg-indigo-600 hover:text-white border-slate-700/80 bg-indigo-500/10 text-indigo-400',
      shareLink: `mailto:?subject=${encodeURIComponent(modalTitle)}&body=${encodeURIComponent(lang.shareText + '\n\n' + shareUrl)}`
    }
  ];

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(shareUrl)}&margin=12&color=0f172a&bgcolor=ffffff`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ChatGPT-Style Dialog Window */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-900 text-slate-100 shadow-2xl shadow-indigo-950/50 z-10 transition-all transform animate-in fade-in zoom-in-95 duration-200">
        
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative flex items-start justify-between p-5 sm:p-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 shadow-sm">
              <Share2 size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                {modalTitle}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 max-w-sm line-clamp-2">
                {modalDescription}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          
          {/* ChatGPT-Style Link Copy Pill */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>{lang.shareHeading}</span>
              <button 
                type="button"
                onClick={() => setShowQr(!showQr)}
                className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition cursor-pointer"
              >
                <QrCode size={14} />
                <span>{showQr ? lang.hideQr : lang.scanQr}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 p-1.5 pl-3.5 rounded-2xl border border-slate-700/80 bg-slate-950 shadow-inner group focus-within:border-indigo-500 transition">
              <Globe size={16} className="text-slate-500 shrink-0 group-focus-within:text-indigo-400 transition" />
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full bg-transparent text-xs sm:text-sm text-slate-200 focus:outline-none select-all truncate font-mono"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 shadow-sm cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-emerald-950/40'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/40 active:scale-95'
                }`}
              >
                {copied ? <Check size={14} className="animate-in zoom-in-50" /> : <Copy size={14} />}
                <span>{copied ? lang.copied : lang.copyLink}</span>
              </button>
            </div>
          </div>

          {/* QR Code Collapsible View */}
          {showQr && (
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/70 text-center space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-2 bg-white rounded-xl inline-block shadow-md">
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-lg"
                />
              </div>
              <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
                <Smartphone size={14} className="text-indigo-400" />
                <span>{lang.qrSubtitle}</span>
              </p>
            </div>
          )}

          {/* Social Direct Share Buttons */}
          <div className="space-y-3 pt-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {lang.shareViaSocial}
            </p>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {socialPlatforms.map((platform) => {
                const IconComponent = platform.icon;
                return (
                  <a
                    key={platform.name}
                    href={platform.shareLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border transition-all duration-200 group ${platform.color}`}
                    title={platform.name}
                  >
                    <IconComponent size={20} className="transition-transform group-hover:scale-110" />
                    <span className="text-[10px] font-semibold text-slate-300 group-hover:text-white truncate max-w-full">
                      {platform.name}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Mobile Native Share Button */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <div className="pt-1">
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 text-xs sm:text-sm font-semibold text-slate-200 transition cursor-pointer"
              >
                <Smartphone size={16} className="text-indigo-400" />
                <span>{lang.nativeShare}</span>
              </button>
            </div>
          )}

        </div>

        {/* Modal Footer Tip */}
        <div className="px-6 py-3.5 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Sparkles size={12} className="text-amber-400" />
            <span>PteasYeung Platform • Smart Living</span>
          </span>
          <span className="text-slate-500">2026</span>
        </div>

      </div>
    </div>
  );
}
