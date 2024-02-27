export {}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      [key: string]: string | undefined

      APP_NAME: string
      APP_DESCRIPTION: string
  
      NEXT_PUBLIC_APP_NAME: string
      NEXT_PUBLIC_APP_DESCRIPTION: string
  
      NEXT_PUBLIC_SUPABASE_URL?: string
      NEXT_PUBLIC_SUPABASE_ANON_KEY?: string
    };
  }
}
