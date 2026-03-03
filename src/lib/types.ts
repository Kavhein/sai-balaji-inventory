export interface Medicine {
    id: number;
    name: string;
    category: string;
    manufacturer: string;
    batch_no: string;
    exp_date: Date;
    hsn_code: string;
    gst_rate: number;
    stock_quantity: number;
    unit_price: number;
    is_available: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface InvoiceItem {
    id: number;
    invoice_id: number;
    medicine_id: number;
    quantity: number;
    unit_price: number;
    gst_rate: number;
    total_price: number;
    medicine?: Medicine;
}

export interface Invoice {
    id: number;
    invoice_no: string;
    patient_name: string;
    mobile_no?: string | null;
    age?: string | null;
    doctor_name: string;
    address?: string | null;
    subtotal: number;
    gst_amount: number;
    total_amount: number;
    payment_mode: string;
    reason?: string | null;
    createdAt: Date;
    patient_id?: number | null;
    items: InvoiceItem[];
    patient?: Patient;
}

export interface Patient {
    id: number;
    name: string;
    mobile_no: string;
    address?: string | null;
    history?: Invoice[];
    createdAt: Date;
    updatedAt: Date;
}

export interface ActivityLog {
    id: number;
    action: string;
    details: string;
    userRole: string;
    createdAt: Date;
}

export interface RevenueTrend {
    label: string;
    amount: number;
}

export interface TopMedicine {
    name: string;
    category: string;
    quantity: number;
    revenue: number;
}

export interface Insight {
    type: 'POSITIVE' | 'STOCK' | 'STRATEGY';
    text: string;
    tip: string;
}

export interface ReportData {
    daily: number;
    weekly: number;
    monthly: number;
    monthlyForecast: number;
    weeklyGrowth: number;
    weeklyTrend: RevenueTrend[];
    topMedicines: TopMedicine[];
    insights: Insight[];
    recentInvoices: Invoice[];
    dailyPatientCount: number;
}
