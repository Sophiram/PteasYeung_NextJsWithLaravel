'use client';

import React, { useEffect, useState, useRef } from 'react';
import { 
    Printer, Download, X, Building2, User, Phone, Mail, 
    Calendar, CheckCircle2, Clock, AlertCircle, ShieldCheck, 
    QrCode, Sparkles, MapPin, FileText, CreditCard
} from 'lucide-react';
import api from '@/lib/api';
import { getOptimizedImageUrl } from '@/app/components/RoomCard';

export interface ReceiptSettings {
    system_name?: string;
    logo_url?: string;
    receipt_logo_url?: string;
    receipt_title_kh?: string;
    receipt_title_en?: string;
    receipt_subtitle_kh?: string;
    receipt_subtitle_en?: string;
    receipt_header_note?: string;
    receipt_footer_note_kh?: string;
    receipt_footer_note_en?: string;
    receipt_terms_kh?: string;
    receipt_terms_en?: string;
    receipt_currency_symbol?: string;
    receipt_khr_exchange_rate?: number;
    receipt_show_water_electricity?: boolean;
    receipt_show_signatures?: boolean;
    receipt_accent_color?: string;
}

export interface ReceiptInvoice {
    id: number;
    invoice_number?: string;
    booking_id?: number;
    electricity_start_unit?: number;
    electricity_end_unit?: number;
    water_unit?: number;
    total_amount: number | string;
    payment_status: 'paid' | 'unpaid' | 'partial';
    due_date?: string;
    paid_at?: string;
    created_at?: string;
    booking?: {
        id?: number;
        room?: {
            id?: number;
            room_number?: string;
            price?: number | string;
            type?: string;
            property?: {
                id?: number;
                title?: string;
                address?: string;
                city?: string;
                owner?: {
                    id?: number;
                    name?: string;
                    phone?: string | null;
                    email?: string | null;
                    bank_name?: string | null;
                    bank_account_name?: string | null;
                    bank_account_number?: string | null;
                    bank_qr_code?: string | null;
                    payment_instructions?: string | null;
                };
            };
        };
        tenant?: {
            id?: number;
            name?: string;
            phone?: string | null;
            email?: string | null;
        };
        owner?: {
            id?: number;
            name?: string;
            phone?: string | null;
            email?: string | null;
            bank_name?: string | null;
            bank_account_name?: string | null;
            bank_account_number?: string | null;
            bank_qr_code?: string | null;
            payment_instructions?: string | null;
        };
    };
}

interface ReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: ReceiptInvoice | null;
    customSettings?: ReceiptSettings | null;
    lang?: 'kh' | 'en';
}

export default function ReceiptModal({
    isOpen,
    onClose,
    invoice,
    customSettings,
    lang = 'kh',
}: ReceiptModalProps) {
    const [settings, setSettings] = useState<ReceiptSettings>({
        system_name: 'ផ្ទះយើង - Pteas Yeung',
        logo_url: '/logo/PteasYeung.png',
        receipt_logo_url: '/logo/PteasYeung.png',
        receipt_title_kh: 'បង្កាន់ដៃទទួលប្រាក់ / វិក្កយបត្រ',
        receipt_title_en: 'OFFICIAL RECEIPT / INVOICE',
        receipt_subtitle_kh: 'ប្រព័ន្ធគ្រប់គ្រងបន្ទប់ជួល ផ្ទះយើង',
        receipt_subtitle_en: 'Pteas Yeung Rental Platform',
        receipt_header_note: 'សូមអរគុណចំពោះការជឿទុកចិត្ត និងស្នាក់នៅជាមួយយើងខ្ញុំ',
        receipt_footer_note_kh: 'សូមអរគុណសម្រាប់ការទូទាត់ប្រាក់ទាន់ពេលវេលា!',
        receipt_footer_note_en: 'Thank you for your prompt payment!',
        receipt_terms_kh: "១. សូមរក្សាទុកបង្កាន់ដៃនេះជាភស្តុតាងនៃការទូទាត់។\n២. ប្រាក់កក់មិនអាចដកវិញបានទេ ប្រសិនបើចាកចេញមុនកាលកំណត់នៃកិច្ចសន្យា។\n៣. ការទូទាត់យឺតយ៉ាវអាចនឹងមានការផាកពិន័យតាមការព្រមព្រៀង។",
        receipt_terms_en: "1. Please retain this receipt as proof of payment.\n2. Security deposits are non-refundable in the event of early termination.\n3. Late payments may incur standard agreed penalties.",
        receipt_currency_symbol: '$',
        receipt_khr_exchange_rate: 4100,
        receipt_show_water_electricity: true,
        receipt_show_signatures: true,
        receipt_accent_color: '#0284c7',
    });

    const receiptRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (customSettings) {
            setSettings(prev => ({ ...prev, ...customSettings }));
        } else {
            api.get('/settings')
                .then(res => {
                    if (res.data) setSettings(prev => ({ ...prev, ...res.data }));
                })
                .catch(() => {});
        }
    }, [customSettings]);

    if (!isOpen || !invoice) return null;

    const isPaid = invoice.payment_status === 'paid';
    const isKh = lang === 'kh';

    // Dynamic Property & Owner Details
    const property = invoice.booking?.room?.property;
    const propertyTitle = property?.title || 'អចលនទ្រព្យផ្ទះយើង (Pteas Yeung)';
    const propertyAddress = [property?.address, property?.city].filter(Boolean).join(', ') || 'រាជធានីភ្នំពេញ';

    // Owner priority: property->owner, then booking->owner
    const owner = property?.owner || invoice.booking?.owner;
    const ownerName = owner?.name || 'ម្ចាស់ផ្ទះ / Property Landlord';
    const ownerPhone = owner?.phone || '';
    const ownerEmail = owner?.email || '';
    const landlordBankName = owner?.bank_name;
    const landlordBankAccountName = owner?.bank_account_name;
    const landlordBankAccountNumber = owner?.bank_account_number;
    const landlordBankQr = owner?.bank_qr_code ? getOptimizedImageUrl(owner.bank_qr_code) : null;
    const landlordPaymentInstructions = owner?.payment_instructions;

    // Tenant details
    const tenant = invoice.booking?.tenant;
    const tenantName = tenant?.name || 'ភ្ញៀវ / Tenant';
    const tenantPhone = tenant?.phone || '';
    const tenantEmail = tenant?.email || '';

    // Room details
    const room = invoice.booking?.room;
    const roomNumber = room?.room_number || '-';
    const roomPrice = Number(room?.price || 0);

    // Utilities breakdown
    const elecStart = Number(invoice.electricity_start_unit || 0);
    const elecEnd = Number(invoice.electricity_end_unit || 0);
    const elecUsage = Math.max(0, elecEnd - elecStart);
    const elecRate = 0.25; // standard rate $/kWh
    const elecAmount = elecUsage * elecRate;

    const waterUnits = Number(invoice.water_unit || 0);
    const waterRate = 0.60; // standard rate $/m3
    const waterAmount = waterUnits * waterRate;

    const totalAmount = Number(invoice.total_amount || (roomPrice + elecAmount + waterAmount));
    const exchangeRate = Number(settings.receipt_khr_exchange_rate || 4100);
    const totalKHR = Math.round(totalAmount * exchangeRate);

    // Dates
    const issueDate = invoice.created_at ? new Date(invoice.created_at).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
    const dueDate = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-GB') : '-';
    const paidDate = invoice.paid_at 
        ? new Date(invoice.paid_at).toLocaleDateString('en-GB') 
        : (isPaid ? issueDate : null);

    const logoSrc = settings.receipt_logo_url || settings.logo_url || '/logo/PteasYeung.png';
    const accentColor = settings.receipt_accent_color || '#0284c7';

    const handlePrint = () => {
        try {
            const receiptElement = document.getElementById('printable-receipt');
            if (!receiptElement) {
                window.print();
                return;
            }

            const printHtml = `
                <!DOCTYPE html>
                <html lang="km">
                    <head>
                        <meta charset="utf-8" />
                        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                        <title>Receipt_${invoice.invoice_number || `INV-${invoice.id}`}</title>
                        <script src="https://cdn.tailwindcss.com"></script>
                        <link rel="preconnect" href="https://fonts.googleapis.com">
                        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                        <link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
                        <style>
                            @page {
                                size: A4 portrait;
                                margin: 8mm 10mm;
                            }
                            * {
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                                box-sizing: border-box;
                                visibility: visible !important;
                            }
                            html, body {
                                background: #ffffff !important;
                                color: #0f172a !important;
                                font-family: 'Kantumruy Pro', 'Inter', system-ui, -apple-system, sans-serif !important;
                                margin: 0 !important;
                                padding: 12px !important;
                                width: 100% !important;
                            }
                            .receipt-container {
                                max-width: 800px;
                                margin: 0 auto;
                                background: #ffffff;
                            }
                            img {
                                max-width: 100%;
                                height: auto;
                            }
                        </style>
                    </head>
                    <body class="bg-white text-slate-900">
                        <div class="receipt-container">
                            ${receiptElement.innerHTML}
                        </div>
                    </body>
                </html>
            `;

            // Try clean popup window first
            const printWindow = window.open('', '_blank', 'width=880,height=920');
            if (printWindow) {
                printWindow.document.open();
                printWindow.document.write(printHtml);
                printWindow.document.close();
                printWindow.onload = () => {
                    setTimeout(() => {
                        printWindow.focus();
                        printWindow.print();
                    }, 400);
                };
                setTimeout(() => {
                    try {
                        printWindow.focus();
                        printWindow.print();
                    } catch (e) {}
                }, 600);
                return;
            }

            // Fallback to hidden iframe if popups blocked
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            document.body.appendChild(iframe);

            const frameDoc = iframe.contentWindow?.document;
            if (frameDoc) {
                frameDoc.open();
                frameDoc.write(printHtml);
                frameDoc.close();

                setTimeout(() => {
                    iframe.contentWindow?.focus();
                    iframe.contentWindow?.print();
                    setTimeout(() => {
                        try { document.body.removeChild(iframe); } catch (e) {}
                    }, 2000);
                }, 400);
                return;
            }
        } catch (err) {
            console.error('Print receipt error, falling back to window.print():', err);
        }

        // Native fallback
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200 print:p-0 print:bg-white print:static print:overflow-visible">
            {/* Modal Box */}
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-4 max-h-[95vh] flex flex-col print:border-none print:shadow-none print:max-h-none print:m-0 print:rounded-none print:w-full">
                {/* Header Action Bar (Hidden on Print) */}
                <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 shrink-0 print:hidden">
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-sky-600" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {isPaid ? (isKh ? 'បង្កាន់ដៃទទួលប្រាក់ផ្លូវការ' : 'Official Payment Receipt') : (isKh ? 'វិក្កយបត្រទូទាត់ប្រាក់' : 'Invoice Details')}
                        </span>
                        <span className="font-mono text-xs text-slate-400">
                            #{invoice.invoice_number || `INV-${invoice.id.toString().padStart(5, '0')}`}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                            title="Print receipt or save to PDF"
                        >
                            <Printer size={14} />
                            <span>{isKh ? 'បោះពុម្ព / PDF' : 'Print / Save PDF'}</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Printable Receipt Body */}
                <div 
                    ref={receiptRef}
                    id="printable-receipt"
                    className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-xs bg-white text-slate-900 print:p-6 print:overflow-visible print:bg-white print:text-black"
                    style={{ minHeight: '680px' }}
                >
                    {/* Top Branding & Invoice Title */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b-2 border-slate-900/10">
                        {/* Logo & Property Brand */}
                        <div className="flex items-center gap-3.5">
                            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 p-1">
                                <img
                                    src={logoSrc}
                                    alt="Brand Logo"
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        // Fallback if image path fails
                                        (e.target as HTMLElement).style.display = 'none';
                                    }}
                                />
                            </div>
                            <div>
                                <h1 className="text-base font-black tracking-tight text-slate-900">
                                    {propertyTitle}
                                </h1>
                                <p className="text-[11px] text-slate-500 font-medium">
                                    {settings.receipt_subtitle_kh || 'ប្រព័ន្ធគ្រប់គ្រងបន្ទប់ជួល ផ្ទះយើង'}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                    <MapPin size={10} className="text-sky-600 shrink-0" />
                                    <span>{propertyAddress}</span>
                                </p>
                            </div>
                        </div>

                        {/* Document Type Badge & Invoice Number */}
                        <div className="text-left sm:text-right space-y-1">
                            <div 
                                className="inline-block px-3 py-1 rounded-lg text-white font-black text-xs uppercase tracking-wider shadow-xs"
                                style={{ backgroundColor: accentColor }}
                            >
                                {isPaid 
                                    ? (isKh ? settings.receipt_title_kh || 'បង្កាន់ដៃទទួលប្រាក់' : settings.receipt_title_en || 'OFFICIAL RECEIPT')
                                    : (isKh ? 'វិក្កយបត្រ / INVOICE' : 'INVOICE')
                                }
                            </div>
                            <p className="font-mono font-black text-sm text-slate-900 tracking-tight">
                                {invoice.invoice_number || `#INV-${invoice.id.toString().padStart(5, '0')}`}
                            </p>
                            <p className="text-[11px] text-slate-500">
                                {isKh ? 'កាលបរិច្ឆេទចេញ:' : 'Issue Date:'} <span className="font-semibold text-slate-700">{issueDate}</span>
                            </p>
                            <p className="text-[11px] text-slate-500">
                                {isKh ? 'ថ្ងៃផុតកំណត់:' : 'Due Date:'} <span className="font-semibold text-rose-600">{dueDate}</span>
                            </p>
                        </div>
                    </div>

                    {/* Landlord & Tenant Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                        {/* Landlord / Owner Details */}
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <Building2 size={11} className="text-sky-600" />
                                <span>{isKh ? 'ម្ចាស់អចលនទ្រព្យ (Landlord)' : 'Property Landlord'}</span>
                            </span>
                            <p className="font-bold text-slate-900 text-sm">{ownerName}</p>
                            {ownerPhone && (
                                <p className="text-slate-600 text-[11px] flex items-center gap-1.5">
                                    <Phone size={11} className="text-slate-400" />
                                    <span>{ownerPhone}</span>
                                </p>
                            )}
                            {ownerEmail && (
                                <p className="text-slate-600 text-[11px] flex items-center gap-1.5">
                                    <Mail size={11} className="text-slate-400" />
                                    <span>{ownerEmail}</span>
                                </p>
                            )}
                        </div>

                        {/* Tenant / Bill To Details */}
                        <div className="space-y-1 sm:border-l sm:border-slate-200 sm:pl-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <User size={11} className="text-emerald-600" />
                                <span>{isKh ? 'អ្នកជួល / បង់ប្រាក់ (Bill To)' : 'Tenant / Bill To'}</span>
                            </span>
                            <div className="flex items-center justify-between">
                                <p className="font-bold text-slate-900 text-sm">{tenantName}</p>
                                <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 font-bold font-mono text-[11px]">
                                    បន្ទប់ #{roomNumber}
                                </span>
                            </div>
                            {tenantPhone && (
                                <p className="text-slate-600 text-[11px] flex items-center gap-1.5">
                                    <Phone size={11} className="text-slate-400" />
                                    <span>{tenantPhone}</span>
                                </p>
                            )}
                            {tenantEmail && (
                                <p className="text-slate-600 text-[11px] flex items-center gap-1.5">
                                    <Mail size={11} className="text-slate-400" />
                                    <span>{tenantEmail}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                                <tr>
                                    <th className="py-2.5 px-4">{isKh ? 'បរិយាយ / កាតព្វកិច្ច' : 'Description'}</th>
                                    <th className="py-2.5 px-3 text-center">{isKh ? 'កុងទ័រ / ឯកតា' : 'Meters / Units'}</th>
                                    <th className="py-2.5 px-3 text-right">{isKh ? 'តម្លៃឯកតា' : 'Unit Price'}</th>
                                    <th className="py-2.5 px-4 text-right">{isKh ? 'សរុប ($)' : 'Amount ($)'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-800">
                                {/* 1. Room Rent */}
                                <tr className="hover:bg-slate-50/60">
                                    <td className="py-3 px-4">
                                        <p className="font-bold text-slate-900">
                                            {isKh ? `ថ្លៃជួលបន្ទប់ #${roomNumber}` : `Room Rent #${roomNumber}`}
                                        </p>
                                        <p className="text-[10px] text-slate-400">
                                            {isKh ? `ប្រភេទ: ${room?.type || 'ស្តង់ដារ'} • ជួលប្រចាំខែ` : `Type: ${room?.type || 'Standard'} • Monthly lease`}
                                        </p>
                                    </td>
                                    <td className="py-3 px-3 text-center text-slate-600">1 {isKh ? 'ខែ' : 'mo'}</td>
                                    <td className="py-3 px-3 text-right font-mono">${roomPrice.toFixed(2)}</td>
                                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">${roomPrice.toFixed(2)}</td>
                                </tr>

                                {/* 2. Electricity Usage */}
                                {settings.receipt_show_water_electricity && (
                                    <tr className="hover:bg-slate-50/60">
                                        <td className="py-3 px-4">
                                            <p className="font-bold text-slate-900">
                                                {isKh ? 'ថ្លៃប្រើប្រាស់អគ្គិសនី (Electricity)' : 'Electricity Consumption'}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-mono">
                                                {isKh ? `លេខដើម: ${elecStart} ➜ លេខចុង: ${elecEnd}` : `Start: ${elecStart} ➜ End: ${elecEnd}`}
                                            </p>
                                        </td>
                                        <td className="py-3 px-3 text-center text-slate-600 font-mono font-semibold">
                                            {elecUsage} kWh
                                        </td>
                                        <td className="py-3 px-3 text-right font-mono">${elecRate.toFixed(2)}</td>
                                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">${elecAmount.toFixed(2)}</td>
                                    </tr>
                                )}

                                {/* 3. Water Usage */}
                                {settings.receipt_show_water_electricity && (
                                    <tr className="hover:bg-slate-50/60">
                                        <td className="py-3 px-4">
                                            <p className="font-bold text-slate-900">
                                                {isKh ? 'ថ្លៃប្រើប្រាស់ទឹកស្អាត (Clean Water)' : 'Water Supply Consumption'}
                                            </p>
                                            <p className="text-[10px] text-slate-400">
                                                {isKh ? 'គិតតាមចំនួនគូបប្រើប្រាស់ជាក់ស្តែង' : 'Billed per cubic meter (m³)'}
                                            </p>
                                        </td>
                                        <td className="py-3 px-3 text-center text-slate-600 font-mono font-semibold">
                                            {waterUnits} m³
                                        </td>
                                        <td className="py-3 px-3 text-right font-mono">${waterRate.toFixed(2)}</td>
                                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">${waterAmount.toFixed(2)}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals & Official Stamp Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        {/* Left: Payment Status Stamp & QR */}
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                            {/* Visual Seal Stamp */}
                            <div className="shrink-0">
                                {isPaid ? (
                                    <div className="w-20 h-20 rounded-full border-4 border-emerald-600/80 flex flex-col items-center justify-center p-1 transform -rotate-12 bg-emerald-50/50 shadow-inner">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                        <span className="text-[11px] font-black tracking-wider text-emerald-700 uppercase leading-none mt-0.5">
                                            PAID
                                        </span>
                                        <span className="text-[8px] font-bold text-emerald-600 leading-none mt-0.5">
                                            {paidDate || issueDate}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="w-20 h-20 rounded-full border-4 border-amber-500/80 flex flex-col items-center justify-center p-1 transform -rotate-6 bg-amber-50/50">
                                        <Clock className="w-5 h-5 text-amber-600" />
                                        <span className="text-[10px] font-black tracking-wider text-amber-700 uppercase leading-none mt-0.5">
                                            UNPAID
                                        </span>
                                        <span className="text-[8px] font-bold text-amber-600 leading-none mt-0.5">
                                            PENDING
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Status Explanation / Payment Note */}
                            <div className="min-w-0 flex-1 space-y-1">
                                <p className="font-bold text-xs text-slate-900">
                                    {isPaid 
                                        ? (isKh ? 'ការទូទាត់ត្រូវបានបញ្ជាក់ជោគជ័យ' : 'Payment Confirmed & Settled') 
                                        : (isKh ? 'រង់ចាំការទូទាត់ពីអ្នកជួល' : 'Awaiting Payment from Tenant')}
                                </p>
                                <p className="text-[10px] text-slate-500 leading-snug">
                                    {isPaid
                                        ? (isKh ? `បានបង់ប្រាក់នៅថ្ងៃ៖ ${paidDate || issueDate}` : `Settled on: ${paidDate || issueDate}`)
                                        : (isKh ? `សូមទូទាត់មុនថ្ងៃ៖ ${dueDate}` : `Please settle before: ${dueDate}`)}
                                </p>
                                <div className="pt-1 flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                                    <QrCode size={13} className="text-sky-600" />
                                    <span>ABA Pay / Bakong / Cash</span>
                                </div>
                            </div>
                        </div>

                        {/* Right: Total Summary */}
                        <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col justify-between space-y-2">
                            <div className="flex items-center justify-between text-slate-300 text-xs">
                                <span>{isKh ? 'ទឹកប្រាក់សរុប (USD)' : 'Total Amount (USD)'}</span>
                                <span className="text-xl font-black font-mono text-white">
                                    ${totalAmount.toFixed(2)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-800">
                                <span>{isKh ? 'ប្រាក់រៀល (KHR)' : 'Khmer Riel (KHR)'}</span>
                                <span className="font-bold font-mono text-sky-400 text-sm">
                                    ៛{totalKHR.toLocaleString()}
                                </span>
                            </div>

                            <p className="text-[9px] text-slate-500 text-right">
                                {isKh ? `អត្រាប្តូរប្រាក់: $1 = ${exchangeRate.toLocaleString()} ៛` : `Rate: $1 = ${exchangeRate.toLocaleString()} KHR`}
                            </p>
                        </div>
                    </div>

                    {/* Landlord Payment Method & Instructions (for tenant settlement) */}
                    {(landlordBankAccountNumber || landlordBankQr) && (
                        <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="space-y-1.5 flex-1 min-w-0">
                                <span className="text-[10px] font-black uppercase tracking-wider text-sky-800 flex items-center gap-1.5">
                                    <CreditCard size={13} className="text-sky-600" />
                                    <span>{isKh ? 'ព័ត៌មានគណនីធនាគាររបស់ម្ចាស់ផ្ទះ (Payment Method)' : 'Landlord Payment Account'}</span>
                                </span>
                                <div className="space-y-0.5">
                                    <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                        <span>{landlordBankName || 'Bank'}:</span>
                                        <span className="font-mono text-sky-700 font-black tracking-wide text-sm">{landlordBankAccountNumber}</span>
                                    </p>
                                    {landlordBankAccountName && (
                                        <p className="text-[11px] font-bold text-slate-700">
                                            {landlordBankAccountName}
                                        </p>
                                    )}
                                    {landlordPaymentInstructions && (
                                        <p className="text-[10px] text-slate-600 italic pt-1 leading-snug">
                                            💡 {landlordPaymentInstructions}
                                        </p>
                                    )}
                                </div>
                            </div>
                            {landlordBankQr && (
                                <div className="shrink-0 flex flex-col items-center gap-1 text-center">
                                    <div className="w-20 h-20 rounded-xl bg-white p-1 border border-sky-200 shadow-xs flex items-center justify-center">
                                        <img 
                                            src={landlordBankQr} 
                                            alt="Landlord KHQR" 
                                            className="w-full h-full object-contain"
                                            onError={(e) => {
                                                (e.target as HTMLElement).style.display = 'none';
                                            }}
                                        />
                                    </div>
                                    <span className="text-[9px] font-black text-sky-700 uppercase tracking-wider">
                                        Scan KHQR
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Terms & Conditions / Policy Note */}
                    {(settings.receipt_terms_kh || settings.receipt_footer_note_kh) && (
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-[10px] text-slate-500 space-y-1 leading-relaxed">
                            <p className="font-bold text-slate-700">
                                {isKh ? 'លក្ខខណ្ឌ & ការបញ្ជាក់ (Terms & Conditions):' : 'Terms & Conditions:'}
                            </p>
                            <p className="whitespace-pre-line text-slate-600">
                                {isKh ? settings.receipt_terms_kh : (settings.receipt_terms_en || settings.receipt_terms_kh)}
                            </p>
                            {settings.receipt_footer_note_kh && (
                                <p className="font-semibold text-slate-800 pt-1">
                                    {isKh ? settings.receipt_footer_note_kh : (settings.receipt_footer_note_en || settings.receipt_footer_note_kh)}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Signatures Section */}
                    {settings.receipt_show_signatures && (
                        <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs">
                            {/* Landlord signature */}
                            <div className="space-y-12">
                                <p className="font-bold text-slate-700">
                                    {isKh ? 'ហត្ថលេខាម្ចាស់ផ្ទះ / Landlord' : "Landlord's Signature"}
                                </p>
                                <div>
                                    <div className="w-36 mx-auto border-b border-dashed border-slate-400 pb-1" />
                                    <p className="font-bold text-slate-800 text-[11px] mt-1">{ownerName}</p>
                                </div>
                            </div>

                            {/* Tenant signature */}
                            <div className="space-y-12">
                                <p className="font-bold text-slate-700">
                                    {isKh ? 'ហត្ថលេខាអ្នកជួល / Tenant' : "Tenant's Signature"}
                                </p>
                                <div>
                                    <div className="w-36 mx-auto border-b border-dashed border-slate-400 pb-1" />
                                    <p className="font-bold text-slate-800 text-[11px] mt-1">{tenantName}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Print Footer Watermark */}
                    <div className="pt-4 text-center text-[9px] text-slate-400 border-t border-slate-100">
                        {settings.system_name || 'ផ្ទះយើង (Pteas Yeung)'} • Generated on {new Date().toLocaleString('en-GB')}
                    </div>
                </div>
            </div>
        </div>
    );
}
