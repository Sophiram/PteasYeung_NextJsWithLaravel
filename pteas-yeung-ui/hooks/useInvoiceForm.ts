import { useState } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export function useInvoiceForm(invoices: any[], setInvoices: Function) {
  const [isSaving, setIsSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null); // រក្សាទុកសម្រាប់ Edit
  const [isEdit, setIsEdit] = useState(false);

  const openAdd = () => {
    setSelectedInvoice(null);
    setIsEdit(false);
    setIsOpen(true);
  };

  const openEdit = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsEdit(true);
    setIsOpen(true);
  };

  const handleSave = async (formData: any) => {
    setIsSaving(true);

    // 🟢 1. ចាប់យក Object ទិន្នន័យពី Form
    let rawData = formData;
    if (formData && typeof formData.preventDefault === "function") {
      formData.preventDefault();
      rawData = formData.target
        ? Object.fromEntries(new FormData(formData.target))
        : {};
    }

    const data = rawData || {};
    console.log("🔍 Raw data received in handleSave:", data);

    try {
      if (isEdit) {
        // 🟢 2. ករណី EDIT
        const currentStatus = data.payment_status || data.status;
        const updatePayload = {
          status: currentStatus === "paid" ? "paid" : "unpaid",
          payment_status: currentStatus === "paid" ? "paid" : "unpaid",
        };

        const invoiceId = selectedInvoice?.id || data.id;
        if (!invoiceId) {
          toast.error("មិនអាចស្វែងរកលេខកូដវិក្កយបត្រដើម្បីកែប្រែបានទេ!");
          setIsSaving(false);
          return;
        }

        await api.put(`/admin/invoices/${invoiceId}`, updatePayload);

        setInvoices(
          invoices.map((inv) =>
            inv.id === invoiceId
              ? { ...inv, payment_status: updatePayload.payment_status }
              : inv,
          ),
        );
        toast.success("ធ្វើបច្ចុប្បន្នភាពស្ថានភាពរួចរាល់!");
      } else {
        // 🟢 3. ករណី CREATE (តម្រូវតាមរូបភាព image_c8ce5c.jpg)
        const bookingId = data.booking_id ? Number(data.booking_id) : null;
        const amountValue =
          data.total_amount !== undefined ? data.total_amount : data.amount;
        const statusValue =
          data.payment_status !== undefined ? data.payment_status : data.status;

        // បង្កើត Payload ដោយរួមបញ្ចូលគ្រប់ Fields ទាំងអស់ដែល Laravel ចង់បាន
        const payload = {
          booking_id: bookingId,
          total_amount:
            amountValue !== undefined && !isNaN(Number(amountValue))
              ? Number(amountValue)
              : 0,
          payment_status: statusValue === "paid" ? "paid" : "unpaid",
          electricity_start_unit:
            data.electricity_start_unit !== undefined
              ? Number(data.electricity_start_unit)
              : 0,
          electricity_end_unit:
            data.electricity_end_unit !== undefined
              ? Number(data.electricity_end_unit)
              : 0,
          water_unit:
            data.water_unit !== undefined ? Number(data.water_unit) : 0,
          due_date: data.due_date || new Date().toISOString().split("T")[0],

          // រក្សាទុក amount និង status ក្រែងលោ Controller ខ្លះនៅប្រើ
          amount:
            amountValue !== undefined && !isNaN(Number(amountValue))
              ? Number(amountValue)
              : 0,
          status: statusValue === "paid" ? "paid" : "unpaid",
        };

        console.log(
          "🚀 Sending POST request with ALL Required Fields:",
          payload,
        );

        if (!payload.booking_id) {
          toast.error("សូមបញ្ចូលលេខកូដ Booking ID ឱ្យបានត្រឹមត្រូវ!");
          setIsSaving(false);
          return;
        }

        const res = await api.post("/admin/invoices", payload);
        const newInvoice = res.data.data || res.data;

        // រៀបចំទម្រង់ដើម្បីបង្ហាញលើ Table របស់ AdminInvoicesPage
        const formattedInvoice = {
          ...newInvoice,
          id: newInvoice.id,
          booking_id: payload.booking_id,
          total_amount: newInvoice.total_amount || payload.total_amount,
          payment_status: newInvoice.payment_status || payload.payment_status,
          due_date: newInvoice.due_date || payload.due_date,
        };

        setInvoices([formattedInvoice, ...invoices]);
        toast.success("បង្កើតវិក្កយបត្រថ្មីបានជោគជ័យ!");
      }
      setIsOpen(false);
    } catch (err: any) {
      console.error("❌ Invoice save error:", err);

      const backendErrors = err.response?.data?.errors;
      const backendMessage = err.response?.data?.message;

      if (backendErrors && typeof backendErrors === "object") {
        Object.keys(backendErrors).forEach((key) => {
          if (Array.isArray(backendErrors[key])) {
            backendErrors[key].forEach((msg: string) => {
              toast.error(`${key}: ${msg}`);
            });
          } else {
            toast.error(`${key}: ${backendErrors[key]}`);
          }
        });
      } else if (backendMessage) {
        toast.error(`Laravel: ${backendMessage}`);
      } else {
        toast.error("មានបញ្ហាក្នុងការតភ្ជាប់ទៅកាន់ Server!");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isOpen,
    setIsOpen,
    isSaving,
    isEdit,
    openAdd,
    openEdit,
    handleSave,
    selectedInvoice,
  };
}
