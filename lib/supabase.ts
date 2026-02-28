import 'react-native-url-polyfill/auto'
import { createClient, SupportedStorage } from '@supabase/supabase-js'
import 'expo-sqlite/localStorage/install';
import { Database } from '@/types/database.types';
import { deleteItemAsync, getItemAsync, setItemAsync } from 'expo-secure-store'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || ''
const supabasePublicKey = process.env.EXPO_PUBLIC_SUPABASE_KEY || ''

const secureStoreAdapter: SupportedStorage = {
  getItem: async (key: string) => {
    return getItemAsync(key)
  },
  setItem: async (key: string, value: string) => {
    return setItemAsync(key, value)
  },
  removeItem: async (key: string) => {
    return deleteItemAsync(key)
  },
} 

const supabase = createClient<Database>(supabaseUrl, supabasePublicKey, {
  auth: {
    storage: secureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

export default supabase