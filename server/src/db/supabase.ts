import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

/**
 * Supabase client with SERVICE ROLE key
 * This client bypasses Row Level Security (RLS)
 * Use this for server-side operations that need admin access
 */
export const supabase: SupabaseClient = createClient(
    supabaseUrl,
    supabaseServiceKey,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        },
        db: {
            schema: 'public'
        }
    }
);

/**
 * Supabase client with ANON key
 * This client respects Row Level Security (RLS)
 * Use this for client-facing operations
 */
export const supabaseAnon: SupabaseClient = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true
        }
    }
);

/**
 * Helper function to handle Supabase errors
 */
export const handleSupabaseError = (error: any, context: string) => {
    console.error(`[Supabase Error] ${context}:`, error);

    if (error.code === 'PGRST116') {
        throw new Error('Record not found');
    }

    if (error.code === '23505') {
        throw new Error('Duplicate entry - record already exists');
    }

    if (error.code === '23503') {
        throw new Error('Referenced record not found');
    }

    throw new Error(error.message || 'Database operation failed');
};

/**
 * Type definitions for database tables
 */
export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string;
                    name: string;
                    email: string;
                    password: string;
                    role: 'student' | 'admin' | 'technician';
                    department: string | null;
                    avatar: string | null;
                    phone: string | null;
                    is_first_login: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['users']['Insert']>;
            };
            assets: {
                Row: {
                    id: string;
                    name: string;
                    type: string;
                    status: 'operational' | 'under_maintenance' | 'faulty' | 'decommissioned';
                    building: string;
                    floor: string;
                    room: string;
                    department: string;
                    qr_url: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['assets']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['assets']['Insert']>;
            };
            complaints: {
                Row: {
                    id: string;
                    title: string;
                    description: string;
                    status: 'reported' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'rejected';
                    severity: 'low' | 'medium' | 'high' | 'critical';
                    images: string | null;
                    video: string | null;
                    otp: string | null;
                    otp_verified: boolean;
                    rejection_reason: string | null;
                    student_id: string;
                    technician_id: string | null;
                    asset_id: string;
                    assigned_at: string | null;
                    resolved_at: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['complaints']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['complaints']['Insert']>;
            };
            technicians: {
                Row: {
                    id: string;
                    user_id: string;
                    skill_type: string;
                    assigned_area: string | null;
                    is_available: boolean;
                    temporary_password: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['technicians']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['technicians']['Insert']>;
            };
            status_history: {
                Row: {
                    id: string;
                    complaint_id: string;
                    status: string;
                    message: string | null;
                    timestamp: string;
                };
                Insert: Omit<Database['public']['Tables']['status_history']['Row'], 'id' | 'timestamp'>;
                Update: Partial<Database['public']['Tables']['status_history']['Insert']>;
            };
            notifications: {
                Row: {
                    id: string;
                    user_id: string;
                    title: string;
                    message: string;
                    type: string;
                    is_read: boolean;
                    related_complaint_id: string | null;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
            };
            audit_logs: {
                Row: {
                    id: string;
                    user_id: string;
                    action: string;
                    details: string | null;
                    timestamp: string;
                };
                Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'timestamp'>;
                Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>;
            };
        };
    };
}

export default supabase;
