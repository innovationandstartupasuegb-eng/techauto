import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
      cookieOptions: {
        // Եթե ուզում ես cookie-ի հատուկ անուն դնել, ապա այստեղ
        name: 'sb-qsbsaqljxqutuputgpmn-auth-token',
      },
      // cookies դաշտը սովորաբար browser client-ի դեպքում ավտոմատ է աշխատում,
      // բայց եթե պետք է, ապա այն սպասում է getAll/setAll ֆունկցիաներ, ոչ թե 'name'
    }
  )
}