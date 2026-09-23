'use client';

import Link from 'next/link';
import { useState } from 'react';
import { 
  Building2, Layers, MapPin, Sparkles, Heart, Eye, ArrowRight,
  ShieldCheck, CheckCircle2, AlertCircle, Camera
} from 'lucide-react';

interface RoomImage {
  id: number;
  image_path?: string;
  image_url?: string;
}

interface Room {
  id: number;
  room_number: string;
  price: string | number;
  deposit?: string | number | null;
  type: string;
  status: string;
  floor?: string | null;
  amenities?: string | string[] | null;
  image?: string | null;
  images?: RoomImage[];
  property?: {
    title: string;
    address?: string;
    city?: string;
    location?: string;
    images?: RoomImage[];
    owner?: {
      id: number;
      name: string;
      phone?: string | null;
      email?: string | null;
    };
  };
}

interface RoomCardProps {
  room: Room;
  currentLang: 'kh' | 'en';
}

import { getOptimizedImageUrl } from '@/lib/utils';
export { getOptimizedImageUrl };

export default function RoomCard({ room, currentLang }: RoomCardProps) {
  const [imgError, setImgError] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const currentStatus = room.status ? room.status.toLowerCase() : '';
  const isAvailable = currentStatus === 'available' || currentStatus === 'ទំនេរ';
  const isOccupied = currentStatus === 'occupied' || currentStatus === 'មានអ្នកជួល';

  const roomPrice = parseFloat(room.price as string);
  const formattedPrice = isNaN(roomPrice) ? '0.00' : roomPrice.toFixed(2);

  const depositNum = room.deposit ? parseFloat(room.deposit.toString()) : 0;
  const hasDeposit = !isNaN(depositNum) && depositNum > 0;

  // Retrieve raw image from images array or single fallback
  const totalPhotos = (room.images && room.images.length > 0) ? room.images.length : (room.image ? 1 : 0);
  const rawImage = (room.images && room.images.length > 0)
    ? room.images[0].image_path
    : room.image
      ? room.image
      : (room.property?.images && room.property.images.length > 0)
        ? room.property.images[0].image_path
        : null;

  const imageUrl = getOptimizedImageUrl(rawImage);

  const t = {
    kh: {
      room: 'បន្ទប់',
      floor: 'ជាន់ទី',
      priceLabel: 'តម្លៃជួល',
      month: 'ខែ',
      viewDetail: 'មើលលម្អិត & កក់',
      available: 'ទំនេរ',
      occupied: 'មានអ្នកជួល',
      maintenance: 'កំពុងជួសជុល',
      deposit: 'ប្រាក់កក់',
      photos: 'រូប',
      approxRiel: 'ប្រហែល'
    },
    en: {
      room: 'Room',
      floor: 'Floor',
      priceLabel: 'Rent Price',
      month: 'mo',
      viewDetail: 'View & Book',
      available: 'Available',
      occupied: 'Occupied',
      maintenance: 'Maintenance',
      deposit: 'Deposit',
      photos: 'photos',
      approxRiel: 'approx.'
    }
  };

  const lang = t[currentLang];

  const getStatusConfig = () => {
    if (isAvailable) {
      return {
        label: lang.available,
        badgeClass: 'bg-emerald-500/95 text-white ring-1 ring-emerald-400/50',
        dotClass: 'bg-emerald-300 animate-pulse'
      };
    }
    if (isOccupied) {
      return {
        label: lang.occupied,
        badgeClass: 'bg-amber-500/95 text-white ring-1 ring-amber-400/50',
        dotClass: 'bg-amber-200'
      };
    }
    return {
      label: lang.maintenance,
      badgeClass: 'bg-rose-500/95 text-white ring-1 ring-rose-400/50',
      dotClass: 'bg-rose-200'
    };
  };

  const statusConfig = getStatusConfig();

  // Approximate KHR exchange rate (~4,100 KHR / USD)
  const rielPrice = Math.round(roomPrice * 4100).toLocaleString();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  return (
    <Link
      href={`/rooms/${room.id}`}
      className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-indigo-500/10 dark:hover:shadow-black/50 hover:-translate-y-1.5 transition-all duration-300 flex flex-col cursor-pointer relative"
    >
      {/* Photo Showcase Container */}
      <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
        
        {/* Subtle Vignette Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20 z-10 pointer-events-none" />

        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={`${lang.room} ${room.room_number}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-slate-400 dark:text-slate-500 group-hover:scale-105 transition-transform duration-500">
            <Building2 className="w-12 h-12 stroke-[1.5] mb-2 text-indigo-400/60" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pteas Yeung</span>
          </div>
        )}

        {/* Top Left: Property Badge */}
        {room.property?.title && (
          <div className="absolute top-3.5 left-3.5 z-20 max-w-[65%]">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-[11px] font-bold text-white shadow-sm truncate border border-white/10">
              <Building2 size={12} className="text-indigo-400 shrink-0" />
              <span className="truncate">{room.property.title}</span>
            </span>
          </div>
        )}

        {/* Top Right: Status Pill & Like Action */}
        <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-2">
          <button
            onClick={handleFavoriteClick}
            aria-label="Save room"
            className="w-8 h-8 rounded-full bg-slate-900/70 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-rose-500 transition-all border border-white/15 active:scale-90"
          >
            <Heart size={14} className={isLiked ? 'fill-rose-500 text-rose-500' : ''} />
          </button>
        </div>

        {/* Bottom Bar inside Image: Status Dot & Photo Counter */}
        <div className="absolute bottom-3 inset-x-3 z-20 flex items-center justify-between pointer-events-none">
          {/* Status Indicator */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-sm backdrop-blur-md ${statusConfig.badgeClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass}`}></span>
            {statusConfig.label}
          </span>

          {/* Photo Count */}
          {totalPhotos > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-white border border-white/10">
              <Camera size={11} />
              <span>{totalPhotos} {lang.photos}</span>
            </span>
          )}
        </div>
      </div>

      {/* Details Container */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        
        {/* Header & Meta */}
        <div>
          {/* Room Number & Type Row */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
              {lang.room} {room.room_number}
            </h3>

            <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
              {room.type}
            </span>
          </div>

          {/* Sub-meta (Floor & Location) */}
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-3">
            {room.floor && (
              <span className="flex items-center gap-1 font-semibold">
                <Layers size={13} className="text-slate-400" />
                {lang.floor} {room.floor}
              </span>
            )}

            {room.property?.city && (
              <span className="flex items-center gap-1 truncate font-medium">
                <MapPin size={13} className="text-slate-400 shrink-0" />
                <span className="truncate">{room.property.city}</span>
              </span>
            )}
          </div>

          {/* Deposit Tag if configured */}
          {hasDeposit && (
            <div className="mb-3.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-[11px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
              <ShieldCheck size={13} className="text-emerald-500" />
              <span>{lang.deposit}: <strong className="text-slate-900 dark:text-white">${depositNum.toFixed(2)}</strong></span>
            </div>
          )}

          {/* Address & Owner Snip */}
          <div className="space-y-1 mb-3.5">
            {room.property?.address && (
              <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                {room.property.address}
              </div>
            )}
            {room.property?.owner?.name && (
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>{currentLang === 'kh' ? 'ម្ចាស់ផ្ទះ៖' : 'Owner:'} {room.property.owner.name}</span>
                {room.property.owner.phone && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1 font-mono">({room.property.owner.phone})</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer: Price & View Details Action */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 mt-auto">
          {/* Pricing */}
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                ${formattedPrice}
              </span>
              <span className="text-xs font-bold text-slate-400">/{lang.month}</span>
            </div>
            <p className="text-[10px] font-medium text-slate-400">
              {lang.approxRiel} {rielPrice} ៛
            </p>
          </div>

          {/* CTA Button */}
          <div className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-600 text-slate-700 dark:text-slate-300 group-hover:text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-sm group-hover:shadow-md group-hover:shadow-indigo-600/30">
            <span>{lang.viewDetail}</span>
            <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>
    </Link>
  );
}