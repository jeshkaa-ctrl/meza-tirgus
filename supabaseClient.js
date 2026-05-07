import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'TAVS_SUPABASE_URL'
const supabaseKey = 'TAVS_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseKey)
