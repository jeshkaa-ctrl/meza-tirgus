import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://reuyrtiwzcxdknnmycev.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_CClCjnn03F8gJ_u9T2HalQ_Sq83gU1C";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);