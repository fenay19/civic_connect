import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn(
        "⚠️  Supabase credentials not found. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env file"
    );
}

export const supabase = createClient(
    supabaseUrl || "",
    supabaseServiceKey || "",
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);
