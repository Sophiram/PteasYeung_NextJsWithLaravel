// services/bookingService.ts
import api from '@/lib/api';

// បង្កើត Interface សម្រាប់កំណត់ប្រភេទលក្ខណៈទិន្នន័យ (TypeScript Type)
export interface Booking {
    id: number;
    room_id: number;
    tenant_id: number;
    check_in_date: string;
    check_out_date: string | null;
    deposit_amount: string;
    status: string;
}

export const bookingService = {
    // សម្រាប់ Tenant មើលការកក់របស់ខ្លួនឯង (/api/my-bookings)
    getMyBookings: async (): Promise<Booking[]> => {
        const response = await api.get('/my-bookings');
        return response.data;
    },

    // សម្រាប់បង្កើតការកក់ថ្មី
    createBooking: async (bookingData: Omit<Booking, 'id' | 'status'>) => {
        const response = await api.post('/bookings', bookingData);
        return response.data;
    }
};