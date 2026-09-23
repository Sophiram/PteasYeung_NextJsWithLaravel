'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { 
  MapPin, Building2, Compass, LayoutGrid, Layers, Info, Calendar, 
  ChevronLeft, ChevronRight, X, Phone, Send, Mail, Share2, 
  ShieldCheck, Wifi, Wind, Bath, Car, Flame, CheckCircle2, 
  Sparkles, Clock, ArrowLeft, Check, MessageCircle, AlertCircle
} from 'lucide-react';
import Swal from 'sweetalert2';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { getOptimizedImageUrl } from '@/app/components/RoomCard';
import DarkModeToggle from '@/app/components/DarkModeToggle';

interface RoomImage {
  id: number;
  image_path: string;
}

interface PropertyImage {
  id: number;
  property_id: number;
  image_path: string;
}

interface Owner {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  profile_picture?: string | null;
}

interface Property {
  id: number;
  title: string;
  address?: string;
  city?: string;
  description?: string;
  location_map_link?: string;
  images?: PropertyImage[];
  owner?: Owner | null;
}

interface Room {
  id: number;
  room_number: string;
  price: string | number;
  deposit?: string | number;
  type: string;
  status: string;
  floor: string | null;
  description?: string;
  amenities?: string | string[];
  images?: RoomImage[];
  property?: Property;
}

// 🛠️ Helper to map amenity names to icons
function getAmenityIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('wifi') || lower.includes('internet')) return <Wifi size={16} className="text-indigo-500" />;
  if (lower.includes('air') || lower.includes('ត្រជាក់') || lower.includes('ac')) return <Wind size={16} className="text-sky-500" />;
  if (lower.includes('bath') || lower.includes('ទឹក') || lower.includes('toilet')) return <Bath size={16} className="text-blue-500" />;
  if (lower.includes('hot') || lower.includes('ក្តៅ')) return <Flame size={16} className="text-amber-500" />;
  if (lower.includes('park') || lower.includes('ចត') || lower.includes('moto') || lower.includes('car')) return <Car size={16} className="text-emerald-500" />;
  if (lower.includes('security') || lower.includes('សន្តិសុខ') || lower.includes('guard')) return <ShieldCheck size={16} className="text-violet-500" />;
  if (lower.includes('balcony') || lower.includes('វេរ៉ង់ដា')) return <Sparkles size={16} className="text-rose-500" />;
  return <CheckCircle2 size={16} className="text-indigo-500" />;
}

export default function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const roomId = resolvedParams.id;

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 🟢 Global Language State
  const { lang, setLang } = useLanguage();

  // 🟢 Booking State
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [isBookedSuccess, setIsBookedSuccess] = useState(false);
  const [hasActiveBooking, setHasActiveBooking] = useState(false);

  // 🟢 Lightbox Modal State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // 🟢 Contact Owner Modal State
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquiryLoading, setInquiryLoading] = useState(false);

  const { user } = useAuth();

  const handleLangToggle = (newLang: 'kh' | 'en') => {
    setLang(newLang);
  };

  const t = {
    kh: {
      back: 'ត្រឡប់ក្រោយ',
      loading: 'កំពុងទាញយកទិន្នន័យបន្ទប់...',
      notFound: 'រកមិនឃើញទិន្នន័យបន្ទប់ឡើយ',
      goHome: 'ត្រឡប់ទៅទំព័រដើម',
      monthlyPrice: 'តម្លៃជួលប្រចាំខែ',
      deposit: 'ប្រាក់កក់ធានា (Deposit)',
      month: '/ ខែ',
      bookingInfo: 'ស្នើសុំកក់បន្ទប់',
      bookingSubtitle: 'បំពេញកាលបរិច្ឆេទដើម្បីកក់បន្ទប់នេះ',
      checkIn: 'ថ្ងៃចូលស្នាក់នៅ *',
      checkOut: 'ថ្ងៃចាកចេញ (បើមាន)',
      submitBtn: 'ស្នើសុំកក់បន្ទប់ឥឡូវនេះ',
      submitting: 'កំពុងផ្ញើសំណើកក់...',
      booked: '✓ បានផ្ញើសំណើកក់រួចរាល់',
      notAvailable: 'បន្ទប់នេះមិនទំនេរទេ',
      room: 'បន្ទប់លេខ',
      type: 'ប្រភេទបន្ទប់៖',
      floor: 'ជាន់ទី៖',
      description: 'ពិពណ៌នាលម្អិតអំពីបន្ទប់',
      noDescription: 'មិនមានការពិពណ៌នាលម្អិតសម្រាប់បន្ទប់នេះនៅឡើយទេ។',
      amenities: 'គ្រឿងបរិក្ខារ & សេវាកម្ម',
      noAmenities: 'មិនទាន់មានការកំណត់គ្រឿងបរិក្ខារនៅឡើយទេ។',
      aboutProperty: 'អំពីអគារស្នាក់នៅ',
      propertyLocation: 'ទីតាំងអចលនទ្រព្យ',
      map: 'ផែនទីទីតាំង',
      openMap: 'បើកមើលក្នុង Google Maps',
      shareRoom: 'ចែករំលែកបន្ទប់',
      linkCopied: 'បានចម្លងតំណភ្ជាប់ទៅកាន់ Clipboard រួចរាល់!',
      loginAlertTitle: 'សូមចូលប្រើប្រាស់គណនី!',
      loginAlertText: 'អ្នកត្រូវតែមានគណនី និងចូលប្រើជាមុនសិន ទើបអាចធ្វើការកក់បន្ទប់បាន។',
      goToLogin: 'ទៅកាន់ទំព័រ Login',
      cancel: 'បោះបង់',
      successTitle: 'កក់បន្ទប់ជោគជ័យ!',
      successText: 'សំណើកក់បន្ទប់របស់អ្នកត្រូវបានផ្ញើជូនម្ចាស់ផ្ទះរួចរាល់ហើយ។',
      ok: 'យល់ព្រម',
      failedTitle: 'បរាជ័យ!',
      selectCheckInError: 'សូមជ្រើសរើសថ្ងៃចូលស្នាក់នៅ!',
      imagesCount: 'រូបភាព',
      moreImagesHint: 'ចុចលើរូបដើម្បីពង្រីក ឬបង្វិលមើលរូបភាពបន្ថែម',
      ownerSectionTitle: 'ទំនាក់ទំនងម្ចាស់ផ្ទះ',
      ownerVerified: 'ម្ចាស់ផ្ទះផ្ទៀងផ្ទាត់រួច (Verified)',
      ownerFastReply: 'ឆ្លើយតបរហ័សក្នុងរយៈពេល ១-២ ម៉ោង',
      callOwner: 'ហៅទូរស័ព្ទផ្ទាល់',
      chatTelegram: 'ជជែកតាម Telegram',
      emailOwner: 'ផ្ញើអ៊ីមែល',
      sendInquiry: 'ផ្ញើសារសាកសួរផ្ទាល់',
      inquiryTitle: 'ផ្ញើសារសាកសួរម្ចាស់ផ្ទះ',
      inquiryDesc: 'ផ្ញើសំណួររបស់អ្នកទាក់ទងនឹងបន្ទប់នេះ ម្ចាស់ផ្ទះនឹងទទួលបានការជូនដំណឹងភ្លាមៗ។',
      senderName: 'ឈ្មោះរបស់អ្នក *',
      senderPhone: 'លេខទូរស័ព្ទ *',
      senderEmail: 'អ៊ីមែល (បើមាន)',
      inquiryMsgPlaceholder: 'សួស្តី! ខ្ញុំចាប់អារម្មណ៍បន្ទប់នេះ តើបន្ទប់នៅទំនេរទេ និងអាចចូលមើលនៅពេលណាបាន?',
      sendInquiryBtn: 'ផ្ញើសារជូនម្ចាស់ផ្ទះ',
      sendingInquiry: 'កំពុងផ្ញើសារ...',
      inquirySuccess: 'សារសាកសួរត្រូវបានផ្ញើជូនម្ចាស់ផ្ទះជោគជ័យ!',
      moveInBreakdown: 'ការប៉ាន់ស្មានការចំណាយពេលចូលនៅ',
      estElectricity: 'ថ្លៃភ្លើង៖ គិតតាមកុងទ័រជាក់ស្តែង (~1,000៛/kWh)',
      estWater: 'ថ្លៃទឹក៖ គិតតាមកុងទ័រជាក់ស្តែង (~2,500៛/m³)',
      estTotal: 'សរុបពេលចូលស្នាក់នៅ (ប៉ាន់ស្មាន)',
    },
    en: {
      back: 'Back',
      loading: 'Loading room details...',
      notFound: 'Room data not found',
      goHome: 'Back to Home',
      monthlyPrice: 'Monthly Rent',
      deposit: 'Security Deposit',
      month: '/ month',
      bookingInfo: 'Request Room Booking',
      bookingSubtitle: 'Select dates to reserve this room',
      checkIn: 'Check-in Date *',
      checkOut: 'Check-out Date (Optional)',
      submitBtn: 'Request Booking Now',
      submitting: 'Submitting request...',
      booked: '✓ Booking Requested',
      notAvailable: 'Room Not Available',
      room: 'Room',
      type: 'Room Type:',
      floor: 'Floor Level:',
      description: 'Room Description',
      noDescription: 'No description provided for this room yet.',
      amenities: 'Amenities & Facilities',
      noAmenities: 'No amenities specified yet.',
      aboutProperty: 'About Property & Building',
      propertyLocation: 'Property Location',
      map: 'Location Map',
      openMap: 'Open in Google Maps',
      shareRoom: 'Share Room',
      linkCopied: 'Link copied to clipboard!',
      loginAlertTitle: 'Please Sign In!',
      loginAlertText: 'You need to be signed in with an account to submit a room booking request.',
      goToLogin: 'Go to Login Page',
      cancel: 'Cancel',
      successTitle: 'Booking Successful!',
      successText: 'Your booking request has been forwarded to the property owner.',
      ok: 'OK',
      failedTitle: 'Failed!',
      selectCheckInError: 'Please select a check-in date!',
      imagesCount: 'Photos',
      moreImagesHint: 'Click to enlarge or browse all room photos',
      ownerSectionTitle: 'Contact Landlord',
      ownerVerified: 'Verified Landlord',
      ownerFastReply: 'Usually responds within 1-2 hours',
      callOwner: 'Call Direct',
      chatTelegram: 'Chat on Telegram',
      emailOwner: 'Send Email',
      sendInquiry: 'Send Inquiry Message',
      inquiryTitle: 'Send Inquiry to Landlord',
      inquiryDesc: 'Ask a question about this room. The landlord will receive an instant notification.',
      senderName: 'Your Name *',
      senderPhone: 'Phone Number *',
      senderEmail: 'Email Address (Optional)',
      inquiryMsgPlaceholder: 'Hi! I am interested in this room. Is it currently available for viewing?',
      sendInquiryBtn: 'Send Inquiry Now',
      sendingInquiry: 'Sending message...',
      inquirySuccess: 'Your message has been sent to the property owner!',
      moveInBreakdown: 'Estimated Move-in Cost',
      estElectricity: 'Electricity: Metered (~$0.25/kWh)',
      estWater: 'Water: Metered (~$0.60/m³)',
      estTotal: 'Est. Total on Move-in',
    }
  };

  const currentT = t[lang];

  // Fetch Room Details
  useEffect(() => {
    const fetchRoomDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/rooms/${roomId}`);
        const roomData = response.data?.data ?? response.data;
        setRoom(roomData);
      } catch (err: any) {
        console.error(err);
        setError('មិនអាចទាញយកព័ត៌មានលម្អិតរបស់បន្ទប់នេះបានទេ!');
      } finally {
        setLoading(false);
      }
    };

    const checkUserBooking = async () => {
      if (!user) return;
      try {
        const res = await api.get('/bookings');
        const userBookings = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        const existingBooking = userBookings.find(
          (b: any) => (b.room_id === Number(roomId) || b.room?.id === Number(roomId)) && b.status !== 'cancelled'
        );
        if (existingBooking) {
          setHasActiveBooking(true);
          setIsBookedSuccess(true);
        }
      } catch (err) {
        console.error('Error checking bookings:', err);
      }
    };

    if (roomId) {
      fetchRoomDetails();
      checkUserBooking();
    }
  }, [roomId, user]);

  // Pre-fill inquiry form if user logged in
  useEffect(() => {
    if (user) {
      if (user.name) setInquiryName(user.name);
      if (user.phone) setInquiryPhone(user.phone);
      if (user.email) setInquiryEmail(user.email);
    }
  }, [user]);

  // Handle Booking
  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      Swal.fire({
        title: currentT.loginAlertTitle,
        text: currentT.loginAlertText,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#4f46e5',
        cancelButtonColor: '#64748b',
        confirmButtonText: currentT.goToLogin,
        cancelButtonText: currentT.cancel,
        customClass: {
          popup: 'rounded-3xl font-sans',
          confirmButton: 'rounded-xl px-5 py-2.5 font-bold',
          cancelButton: 'rounded-xl px-5 py-2.5 font-bold'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          router.push(`/login?redirect=/rooms/${roomId}`);
        }
      });
      return;
    }

    if (!checkInDate) {
      Swal.fire(currentT.failedTitle, currentT.selectCheckInError, 'error');
      return;
    }

    setBookingLoading(true);

    try {
      const response = await api.post('/bookings', {
        room_id: roomId,
        check_in_date: checkInDate,
        check_out_date: checkOutDate || null,
      });

      Swal.fire({
        title: currentT.successTitle,
        text: response.data?.message || currentT.successText,
        icon: 'success',
        confirmButtonColor: '#4f46e5',
        confirmButtonText: currentT.ok,
        customClass: {
          popup: 'rounded-3xl font-sans',
          confirmButton: 'rounded-xl px-5 py-2.5 font-bold'
        }
      });
      setIsBookedSuccess(true);
      setCheckInDate('');
      setCheckOutDate('');
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 401) {
        Swal.fire('Session ផុតកំណត់', 'សូមធ្វើការ Login ម្តងទៀត', 'error');
        router.push(`/login?redirect=/rooms/${roomId}`);
        return;
      }
      const errorMsg = err.response?.data?.message || 'មានបញ្ហាក្នុងការផ្ញើសំណើកក់បន្ទប់។ សូមព្យាយាមម្តងទៀត!';
      Swal.fire({
        title: currentT.failedTitle,
        text: errorMsg,
        icon: 'error',
        confirmButtonColor: '#ef4444',
        confirmButtonText: currentT.ok
      });
    } finally {
      setBookingLoading(false);
    }
  };

  // Handle Send Inquiry to Owner
  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName || !inquiryPhone || !inquiryMessage) {
      toast.error('សូមបំពេញឈ្មោះ លេខទូរស័ព្ទ និងខ្លឹមសារសារ!');
      return;
    }

    setInquiryLoading(true);
    try {
      await api.post(`/rooms/${roomId}/contact`, {
        name: inquiryName,
        phone: inquiryPhone,
        email: inquiryEmail || null,
        message: inquiryMessage,
      });

      toast.success(currentT.inquirySuccess);
      setInquiryModalOpen(false);
      setInquiryMessage('');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'ការផ្ញើសារសាកសួរបរាជ័យ!');
    } finally {
      setInquiryLoading(false);
    }
  };

  // Handle Share Room
  const handleShare = async () => {
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success(currentT.linkCopied, {
          icon: '🔗',
          style: { borderRadius: '16px', background: '#1e293b', color: '#fff' },
        });
      } catch {
        toast.success(currentT.linkCopied);
      }
    }
  };

  // Image Navigation
  const handleNextImage = () => {
    if (images.length > 0) {
      setLightboxIndex((prev) => (prev + 1) % images.length);
    }
  };

  const handlePrevImage = () => {
    if (images.length > 0) {
      setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">{currentT.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-rose-600 font-bold mb-4">{error || currentT.notFound}</p>
          <button
            onClick={() => router.push('/')}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition shadow-sm"
          >
            {currentT.goHome}
          </button>
        </div>
      </div>
    );
  }

  // Parse images
  const images = (room.images && room.images.length > 0)
    ? room.images
    : (room.property?.images && room.property.images.length > 0)
      ? room.property.images
      : [];
  const hasImages = images.length > 0;
  const currentImage = hasImages ? images[lightboxIndex] : null;

  // Status badge styling
  const isAvailable = room.status?.toLowerCase() === 'available' || room.status === 'ទំនេរ';
  const getStatusBadgeClass = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'available' || s === 'ទំនេរ') return 'bg-emerald-500 text-white';
    if (s === 'occupied' || s === 'មានអ្នកជួល') return 'bg-amber-500 text-white';
    return 'bg-rose-500 text-white';
  };

  // Parse amenities array
  const parsedAmenities: string[] = Array.isArray(room.amenities)
    ? room.amenities
    : typeof room.amenities === 'string'
      ? room.amenities.split(',').map((a) => a.trim()).filter(Boolean)
      : [];

  // Owner details
  const owner = room.property?.owner;
  const ownerName = owner?.name || (lang === 'kh' ? 'ម្ចាស់អគារ' : 'Property Owner');
  const ownerPhone = owner?.phone || '';
  const ownerEmail = owner?.email || '';
  const cleanPhone = ownerPhone.replace(/[^0-9]/g, '');
  const telegramPhone = cleanPhone.startsWith('0') ? '855' + cleanPhone.slice(1) : cleanPhone;
  const telegramUrl = cleanPhone ? (cleanPhone.startsWith('@') ? `https://t.me/${cleanPhone.replace('@', '')}` : `tg://resolve?phone=${telegramPhone}`) : '#';

  const roomPriceNum = parseFloat(room.price as string) || 0;
  const roomDepositNum = room.deposit ? parseFloat(room.deposit as string) || 0 : 0;
  const totalMoveIn = roomPriceNum + roomDepositNum;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      <Toaster position="top-center" />

      <div className="max-w-6xl mx-auto">

        {/* 🧭 Top Navigation Bar */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-2 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{currentT.back}</span>
          </button>

          <div className="flex items-center gap-2.5">
            {/* 🌓 Dark / Light Mode Toggle */}
            <DarkModeToggle 
              lang={lang} 
              className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-xs" 
            />

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-xs cursor-pointer"
              title={currentT.shareRoom}
            >
              <Share2 size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">{currentT.shareRoom}</span>
            </button>

            {/* Language Switcher */}
            <div className="flex items-center p-1 bg-slate-200/80 dark:bg-slate-800 rounded-xl text-xs font-bold border border-slate-300/50 dark:border-slate-700/60">
              <button
                onClick={() => handleLangToggle('kh')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${lang === 'kh' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-black' : 'text-slate-600 dark:text-slate-400'}`}
              >
                🇰🇭 ខ្មែរ
              </button>
              <button
                onClick={() => handleLangToggle('en')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${lang === 'en' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-black' : 'text-slate-600 dark:text-slate-400'}`}
              >
                🇬🇧 EN
              </button>
            </div>
          </div>
        </div>

        {/* 📐 Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* 🖼️ Left 2 Columns: Photos & Detailed Specs */}
          <div className="lg:col-span-2 space-y-6">

            {/* Main Image Banner & Gallery */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
              <div 
                className="aspect-[16/9] sm:aspect-[16/10] bg-slate-900 flex items-center justify-center text-slate-400 relative overflow-hidden group cursor-pointer" 
                onClick={() => hasImages && setLightboxOpen(true)}
              >
                {hasImages ? (
                  <>
                    <img
                      src={getOptimizedImageUrl(images[0]?.image_path) || 'https://placehold.co/800x450?text=No+Image'}
                      alt={`Room ${room.room_number}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/800x450?text=No+Image';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>

                    {images.length > 1 && (
                      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 bg-black/70 hover:bg-black/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/20 transition-all">
                        <span>📷 {images.length} {currentT.imagesCount}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center p-8 text-slate-400">
                    <Building2 className="w-16 h-16 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold">No Image Available</p>
                  </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-4 left-4 z-10">
                  <span className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-md ${getStatusBadgeClass(room.status)}`}>
                    {room.status}
                  </span>
                </div>
              </div>

              {/* Thumbnail Strip */}
              {hasImages && images.length > 1 && (
                <div className="bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 p-4">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2.5">{currentT.moreImagesHint}</p>
                  <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                    {images.map((img, idx) => (
                      <button
                        key={img.id || idx}
                        onClick={() => {
                          setLightboxIndex(idx);
                          setLightboxOpen(true);
                        }}
                        className={`flex-shrink-0 w-20 h-16 rounded-xl border-2 overflow-hidden transition-all cursor-pointer ${
                          lightboxIndex === idx ? 'border-indigo-600 ring-2 ring-indigo-400/40' : 'border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={getOptimizedImageUrl(img.image_path) || 'https://placehold.co/80x60?text=No+Image'}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Room Title, Property, Specs */}
              <div className="p-6 sm:p-8">
                {room.property && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
                    <Building2 size={14} />
                    <span>{room.property.title}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                    {currentT.room} {room.room_number}
                  </h1>

                  <div className="flex items-baseline gap-1 bg-indigo-50 dark:bg-indigo-950/40 px-3.5 py-1.5 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 w-fit">
                    <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                      ${roomPriceNum.toFixed(2)}
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{currentT.month}</span>
                  </div>
                </div>

                {/* Specs Pills */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 font-bold text-xs bg-indigo-50 dark:bg-indigo-950/50 px-3.5 py-2 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                    <LayoutGrid size={14} />
                    <span>{currentT.type} {room.type}</span>
                  </span>
                  {room.floor && (
                    <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold text-xs bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                      <Layers size={14} />
                      <span>{currentT.floor} {room.floor}</span>
                    </span>
                  )}
                  {room.deposit && (
                    <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold text-xs bg-emerald-50 dark:bg-emerald-950/50 px-3.5 py-2 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                      <ShieldCheck size={14} />
                      <span>{currentT.deposit}: ${roomDepositNum.toFixed(2)}</span>
                    </span>
                  )}
                </div>

                {/* Property Address */}
                {room.property?.address && (
                  <div className="border-t border-slate-100 dark:border-slate-800 py-4 flex gap-3 items-start">
                    <div className="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-xl mt-0.5">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{currentT.propertyLocation}</h4>
                      <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 font-medium leading-relaxed">
                        {room.property.address}{room.property.city ? `, ${room.property.city}` : ''}
                      </p>
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                  <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white mb-2.5 flex items-center gap-2">
                    <Info size={18} className="text-indigo-500" />
                    <span>{currentT.description}</span>
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed font-medium whitespace-pre-line bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                    {room.description || currentT.noDescription}
                  </p>
                </div>

                {/* 🌟 Rich Amenities Grid */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-6">
                  <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                    <Sparkles size={18} className="text-indigo-500" />
                    <span>{currentT.amenities}</span>
                  </h3>

                  {parsedAmenities.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {parsedAmenities.map((amenity, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all hover:border-indigo-300 dark:hover:border-indigo-700"
                        >
                          <div className="p-1.5 rounded-lg bg-white dark:bg-slate-700 shadow-2xs">
                            {getAmenityIcon(amenity)}
                          </div>
                          <span className="truncate">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 dark:text-slate-400 text-sm italic">
                      {currentT.noAmenities}
                    </p>
                  )}
                </div>

                {/* About Building */}
                {room.property?.description && (
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-6">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-2">
                      <Building2 size={16} className="text-indigo-500" />
                      <span>{currentT.aboutProperty}</span>
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-medium whitespace-pre-line mb-3">
                      {room.property.description}
                    </p>

                    {room.property.images && room.property.images.length > 0 && (
                      <div className="grid grid-cols-3 gap-2.5 mt-3">
                        {room.property.images.map((img) => (
                          <div key={img.id} className="aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                            <img
                              src={getOptimizedImageUrl(img.image_path) || 'https://placehold.co/300x170?text=No+Image'}
                              alt="Property Overall"
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 🗺️ Location & Map Card */}
            {room.property?.location_map_link && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Compass className="text-indigo-500" size={18} />
                    <span>{currentT.map}</span>
                  </h3>
                  <a
                    href={room.property.location_map_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>{currentT.openMap}</span>
                    <span>↗</span>
                  </a>
                </div>

                <div className="w-full h-72 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100">
                  <iframe
                    src={room.property.location_map_link}
                    className="w-full h-full border-0"
                    allowFullScreen={true}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Google Maps Location"
                  ></iframe>
                </div>
              </div>
            )}
          </div>

          {/* 📞 Right Column: Direct Owner Contact Card & Booking Form */}
          <div className="space-y-6">

            {/* 👤 LANDLORD / OWNER CONTACT CARD */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  {currentT.ownerSectionTitle}
                </span>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/40">
                  Verified
                </span>
              </div>

              {/* Owner Avatar & Name */}
              <div className="flex items-center gap-3.5 mb-5">
                {owner?.profile_picture ? (
                  <img
                    src={getOptimizedImageUrl(owner.profile_picture) || ''}
                    alt={ownerName}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-200 dark:border-indigo-900 shadow-sm"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-xl font-black shadow-md">
                    {ownerName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                    {ownerName}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                    <Clock size={12} className="text-indigo-500" />
                    <span>{currentT.ownerFastReply}</span>
                  </p>
                </div>
              </div>

              {/* Direct Action Buttons */}
              <div className="space-y-2.5">
                {/* 1. Direct Call */}
                {ownerPhone ? (
                  <a
                    href={`tel:${ownerPhone}`}
                    className="w-full flex items-center justify-between px-4 py-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-emerald-700 dark:text-emerald-300 text-xs font-bold transition shadow-2xs group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-xs">
                        <Phone size={14} />
                      </div>
                      <span>{currentT.callOwner}</span>
                    </div>
                    <span className="font-mono text-xs">{ownerPhone}</span>
                  </a>
                ) : null}

                {/* 2. Chat on Telegram */}
                {cleanPhone ? (
                  <a
                    href={telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between px-4 py-3 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 border border-sky-200 dark:border-sky-800/60 rounded-2xl text-sky-700 dark:text-sky-300 text-xs font-bold transition shadow-2xs group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-sky-500 text-white shadow-xs">
                        <MessageCircle size={14} />
                      </div>
                      <span>{currentT.chatTelegram}</span>
                    </div>
                    <span className="text-sky-600 dark:text-sky-400 font-normal text-[11px]">Chat Now →</span>
                  </a>
                ) : null}

                {/* 3. Send Direct In-App Inquiry */}
                <button
                  type="button"
                  onClick={() => setInquiryModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition shadow-md shadow-indigo-500/20 active:scale-[0.99] cursor-pointer"
                >
                  <Send size={14} />
                  <span>{currentT.sendInquiry}</span>
                </button>

                {/* 4. Email Owner if exists */}
                {ownerEmail && (
                  <a
                    href={`mailto:${ownerEmail}?subject=សាកសួរអំពីបន្ទប់លេខ ${room.room_number}`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-700 dark:text-slate-300 text-xs font-bold transition"
                  >
                    <Mail size={14} className="text-slate-400" />
                    <span>{currentT.emailOwner}</span>
                  </a>
                )}
              </div>
            </div>

            {/* 📅 BOOKING & MOVE-IN ESTIMATION CARD */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-3xl shadow-sm sticky top-6">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {currentT.monthlyPrice}
              </span>
              <div className="flex items-baseline gap-1 mt-1 mb-4">
                <span className="text-4xl font-black text-indigo-600 dark:text-indigo-400">
                  ${roomPriceNum.toFixed(2)}
                </span>
                <span className="text-sm font-bold text-slate-400 dark:text-slate-500">{currentT.month}</span>
              </div>

              {room.deposit && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 mb-5">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">{currentT.deposit}</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    ${roomDepositNum.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Move-in Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs mb-5">
                <h5 className="font-bold text-slate-800 dark:text-slate-200 mb-2">
                  {currentT.moveInBreakdown}
                </h5>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>{currentT.monthlyPrice}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">${roomPriceNum.toFixed(2)}</span>
                </div>
                {room.deposit && (
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>{currentT.deposit}</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">${roomDepositNum.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-black text-slate-900 dark:text-white">
                  <span>{currentT.estTotal}</span>
                  <span className="text-indigo-600 dark:text-indigo-400">
                    ${totalMoveIn.toFixed(2)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-[10px] text-slate-400 dark:text-slate-500 space-y-0.5">
                  <p>• {currentT.estElectricity}</p>
                  <p>• {currentT.estWater}</p>
                </div>
              </div>

              {/* Booking Request Form */}
              <form onSubmit={handleBooking} className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-3.5">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Calendar size={16} className="text-indigo-500" />
                    <span>{currentT.bookingInfo}</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{currentT.bookingSubtitle}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    {currentT.checkIn}
                  </label>
                  <input
                    type="date"
                    disabled={!isAvailable || isBookedSuccess || hasActiveBooking}
                    min={new Date().toISOString().split('T')[0]}
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:outline-none focus:border-indigo-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    {currentT.checkOut}
                  </label>
                  <input
                    type="date"
                    disabled={!isAvailable || isBookedSuccess || hasActiveBooking}
                    min={checkInDate || new Date().toISOString().split('T')[0]}
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent focus:outline-none focus:border-indigo-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 font-medium"
                  />
                </div>

                {/* Submit Booking Button */}
                <button
                  type="submit"
                  disabled={!isAvailable || bookingLoading || isBookedSuccess || hasActiveBooking}
                  className={`w-full font-bold py-3.5 rounded-2xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isBookedSuccess || hasActiveBooking
                      ? 'bg-emerald-600 text-white cursor-not-allowed'
                      : isAvailable
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-[0.99]'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {bookingLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{currentT.submitting}</span>
                    </>
                  ) : isBookedSuccess || hasActiveBooking ? (
                    <span>{currentT.booked}</span>
                  ) : isAvailable ? (
                    <span>{currentT.submitBtn}</span>
                  ) : (
                    <span>{currentT.notAvailable}</span>
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>

      {/* 💬 INTERACTIVE CONTACT / INQUIRY MODAL */}
      {inquiryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button
              onClick={() => setInquiryModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="mb-5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                <Send size={18} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {currentT.inquiryTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {currentT.inquiryDesc}
              </p>
            </div>

            <form onSubmit={handleSendInquiry} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {currentT.senderName}
                </label>
                <input
                  type="text"
                  required
                  value={inquiryName}
                  onChange={(e) => setInquiryName(e.target.value)}
                  placeholder="ឧ. សុខ ចាន់ដារ៉ា"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    {currentT.senderPhone}
                  </label>
                  <input
                    type="tel"
                    required
                    value={inquiryPhone}
                    onChange={(e) => setInquiryPhone(e.target.value)}
                    placeholder="012 345 678"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    {currentT.senderEmail}
                  </label>
                  <input
                    type="email"
                    value={inquiryEmail}
                    onChange={(e) => setInquiryEmail(e.target.value)}
                    placeholder="name@mail.com"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {lang === 'kh' ? 'ខ្លឹមសារសារសាកសួរ *' : 'Inquiry Message *'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  placeholder={currentT.inquiryMsgPlaceholder}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium focus:outline-none focus:border-indigo-500 resize-none"
                ></textarea>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setInquiryModalOpen(false)}
                  className="w-1/3 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  {currentT.cancel}
                </button>
                <button
                  type="submit"
                  disabled={inquiryLoading}
                  className="w-2/3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20 cursor-pointer disabled:opacity-50"
                >
                  {inquiryLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{currentT.sendingInquiry}</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>{currentT.sendInquiryBtn}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🖼️ FULLSCREEN LIGHTBOX MODAL */}
      {lightboxOpen && hasImages && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md">
          <div className="w-full h-full flex items-center justify-center relative p-4">
            <div className="w-full h-full max-w-5xl max-h-[85vh] flex items-center justify-center">
              <img
                src={getOptimizedImageUrl(currentImage?.image_path) || 'https://placehold.co/1000x600?text=No+Image'}
                alt={`Room photo ${lightboxIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
              />
            </div>

            {/* Close Button */}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-sm border border-white/20 z-10 cursor-pointer"
              aria-label="Close lightbox"
            >
              <X size={20} />
            </button>

            {/* Previous / Next Controls */}
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-sm border border-white/20 z-10 cursor-pointer"
                  aria-label="Previous photo"
                >
                  <ChevronLeft size={22} />
                </button>

                <button
                  onClick={handleNextImage}
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-sm border border-white/20 z-10 cursor-pointer"
                  aria-label="Next photo"
                >
                  <ChevronRight size={22} />
                </button>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm border border-white/20">
                  {lightboxIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}