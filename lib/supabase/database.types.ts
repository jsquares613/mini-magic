/**
 * Supabase database types — Architecture v2.1.
 *
 * Hand-authored to mirror exactly what `supabase gen types typescript` produces
 * from the migrations in `supabase/migrations/`. Once the database is live, REGENERATE
 * this file to stay in lockstep:
 *
 *   supabase gen types typescript --local > lib/supabase/database.types.ts
 *   # or: supabase gen types typescript --project-id <ref> > lib/supabase/database.types.ts
 *
 * Convention: `Row` = select shape, `Insert` = insert shape (defaults/nullables optional),
 * `Update` = partial of Insert. Relationships are omitted (not needed for client typing);
 * the regenerated file will include them.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          emoji: string | null
          color: string | null
          image: string | null
          banner_image: string | null
          featured: boolean
          display_order: number
          seo_title: string | null
          seo_description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          emoji?: string | null
          color?: string | null
          image?: string | null
          banner_image?: string | null
          featured?: boolean
          display_order?: number
          seo_title?: string | null
          seo_description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
        Relationships: []
      }
      age_groups: {
        Row: {
          id: string
          label: string
          slug: string
          min_age: number | null
          max_age: number | null
          sort_order: number
        }
        Insert: {
          id?: string
          label: string
          slug: string
          min_age?: number | null
          max_age?: number | null
          sort_order?: number
        }
        Update: Partial<Database['public']['Tables']['age_groups']['Insert']>
        Relationships: []
      }
      products: {
        Row: {
          id: string
          name: string
          slug: string
          sku: string | null
          short_description: string | null
          description: string | null
          category_id: string
          price: number | null
          price_display: Database['public']['Enums']['price_display']
          sale_price: number | null
          material: string | null
          color: string | null
          available: boolean
          tags: string[]
          features: string[]
          popular: boolean
          new_arrival: boolean
          display_order: number
          seo_title: string | null
          seo_description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          sku?: string | null
          short_description?: string | null
          description?: string | null
          category_id: string
          price?: number | null
          price_display?: Database['public']['Enums']['price_display']
          sale_price?: number | null
          material?: string | null
          color?: string | null
          available?: boolean
          tags?: string[]
          features?: string[]
          popular?: boolean
          new_arrival?: boolean
          display_order?: number
          seo_title?: string | null
          seo_description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['products']['Insert']>
        Relationships: []
      }
      product_age_groups: {
        Row: { product_id: string; age_group_id: string }
        Insert: { product_id: string; age_group_id: string }
        Update: Partial<Database['public']['Tables']['product_age_groups']['Insert']>
        Relationships: []
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          image_url: string
          alt_text: string | null
          is_primary: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          image_url: string
          alt_text?: string | null
          is_primary?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['product_images']['Insert']>
        Relationships: []
      }
      product_related: {
        Row: {
          id: string
          product_id: string
          related_product_id: string
          sort_order: number
        }
        Insert: {
          id?: string
          product_id: string
          related_product_id: string
          sort_order?: number
        }
        Update: Partial<Database['public']['Tables']['product_related']['Insert']>
        Relationships: []
      }
      category_promotions: {
        Row: {
          id: string
          category_id: string
          title: string
          badge_text: string | null
          description: string | null
          image: string | null
          link: string | null
          active: boolean
          starts_at: string | null
          ends_at: string | null
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          category_id: string
          title: string
          badge_text?: string | null
          description?: string | null
          image?: string | null
          link?: string | null
          active?: boolean
          starts_at?: string | null
          ends_at?: string | null
          display_order?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['category_promotions']['Insert']>
        Relationships: []
      }
      homepage_hero_slides: {
        Row: {
          id: string
          title: string
          subtitle: string | null
          description: string | null
          image: string | null
          button_text: string | null
          button_link: string | null
          display_order: number
          active: boolean
          starts_at: string | null
          ends_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          subtitle?: string | null
          description?: string | null
          image?: string | null
          button_text?: string | null
          button_link?: string | null
          display_order?: number
          active?: boolean
          starts_at?: string | null
          ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['homepage_hero_slides']['Insert']>
        Relationships: []
      }
      homepage_featured_products: {
        Row: { id: string; product_id: string; sort_order: number }
        Insert: { id?: string; product_id: string; sort_order?: number }
        Update: Partial<Database['public']['Tables']['homepage_featured_products']['Insert']>
        Relationships: []
      }
      promotional_banners: {
        Row: {
          id: string
          title: string
          subtitle: string | null
          badge_text: string | null
          image: string | null
          link: string | null
          active: boolean
          starts_at: string | null
          ends_at: string | null
          display_order: number
        }
        Insert: {
          id?: string
          title: string
          subtitle?: string | null
          badge_text?: string | null
          image?: string | null
          link?: string | null
          active?: boolean
          starts_at?: string | null
          ends_at?: string | null
          display_order?: number
        }
        Update: Partial<Database['public']['Tables']['promotional_banners']['Insert']>
        Relationships: []
      }
      play_area: {
        Row: {
          id: number
          hero_image: string | null
          hero_title: string | null
          hero_description: string | null
          timings: Json
          pricing: Json
          rules: string[]
          seo_title: string | null
          seo_description: string | null
          updated_at: string
        }
        Insert: {
          id?: number
          hero_image?: string | null
          hero_title?: string | null
          hero_description?: string | null
          timings?: Json
          pricing?: Json
          rules?: string[]
          seo_title?: string | null
          seo_description?: string | null
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['play_area']['Insert']>
        Relationships: []
      }
      play_area_gallery: {
        Row: { id: string; image_url: string; alt_text: string | null; sort_order: number }
        Insert: { id?: string; image_url: string; alt_text?: string | null; sort_order?: number }
        Update: Partial<Database['public']['Tables']['play_area_gallery']['Insert']>
        Relationships: []
      }
      play_area_features: {
        Row: {
          id: string
          icon: string | null
          title: string
          description: string | null
          sort_order: number
        }
        Insert: {
          id?: string
          icon?: string | null
          title: string
          description?: string | null
          sort_order?: number
        }
        Update: Partial<Database['public']['Tables']['play_area_features']['Insert']>
        Relationships: []
      }
      about_page: {
        Row: {
          id: number
          story: string | null
          story_title: string | null
          story_image: string | null
          mission: string | null
          vision: string | null
          values_text: string | null
          gallery: Json
          hero_title: string | null
          hero_description: string | null
          hero_image: string | null
          seo_title: string | null
          seo_description: string | null
          updated_at: string
        }
        Insert: {
          id?: number
          story?: string | null
          story_title?: string | null
          story_image?: string | null
          mission?: string | null
          vision?: string | null
          values_text?: string | null
          gallery?: Json
          hero_title?: string | null
          hero_description?: string | null
          hero_image?: string | null
          seo_title?: string | null
          seo_description?: string | null
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['about_page']['Insert']>
        Relationships: []
      }
      about_statistics: {
        Row: { id: string; label: string; value: number; suffix: string | null; sort_order: number }
        Insert: { id?: string; label: string; value: number; suffix?: string | null; sort_order?: number }
        Update: Partial<Database['public']['Tables']['about_statistics']['Insert']>
        Relationships: []
      }
      team_members: {
        Row: {
          id: string
          name: string
          designation: string | null
          image: string | null
          bio: string | null
          display_order: number
          active: boolean
        }
        Insert: {
          id?: string
          name: string
          designation?: string | null
          image?: string | null
          bio?: string | null
          display_order?: number
          active?: boolean
        }
        Update: Partial<Database['public']['Tables']['team_members']['Insert']>
        Relationships: []
      }
      testimonials: {
        Row: {
          id: string
          author_name: string
          author_role: string | null
          quote: string
          rating: number | null
          image: string | null
          active: boolean
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          author_name: string
          author_role?: string | null
          quote: string
          rating?: number | null
          image?: string | null
          active?: boolean
          display_order?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['testimonials']['Insert']>
        Relationships: []
      }
      contact_information: {
        Row: {
          id: number
          phone: string | null
          whatsapp: string | null
          email: string | null
          address: string | null
          map_url: string | null
          updated_at: string
        }
        Insert: {
          id?: number
          phone?: string | null
          whatsapp?: string | null
          email?: string | null
          address?: string | null
          map_url?: string | null
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['contact_information']['Insert']>
        Relationships: []
      }
      business_hours: {
        Row: {
          id: string
          day_of_week: number
          opens_at: string | null
          closes_at: string | null
          is_closed: boolean
          note: string | null
        }
        Insert: {
          id?: string
          day_of_week: number
          opens_at?: string | null
          closes_at?: string | null
          is_closed?: boolean
          note?: string | null
        }
        Update: Partial<Database['public']['Tables']['business_hours']['Insert']>
        Relationships: []
      }
      navigation_links: {
        Row: {
          id: string
          label: string
          url: string
          location: Database['public']['Enums']['nav_location']
          display_order: number
          active: boolean
        }
        Insert: {
          id?: string
          label: string
          url: string
          location: Database['public']['Enums']['nav_location']
          display_order?: number
          active?: boolean
        }
        Update: Partial<Database['public']['Tables']['navigation_links']['Insert']>
        Relationships: []
      }
      social_links: {
        Row: {
          id: string
          platform: string
          url: string
          icon: string | null
          sort_order: number
          active: boolean
        }
        Insert: {
          id?: string
          platform: string
          url: string
          icon?: string | null
          sort_order?: number
          active?: boolean
        }
        Update: Partial<Database['public']['Tables']['social_links']['Insert']>
        Relationships: []
      }
      site_settings: {
        Row: { key: string; value: Json }
        Insert: { key: string; value: Json }
        Update: Partial<Database['public']['Tables']['site_settings']['Insert']>
        Relationships: []
      }
      seo_pages: {
        Row: {
          id: string
          page_key: string
          meta_title: string | null
          meta_description: string | null
          keywords: string[]
          og_image: string | null
          canonical: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          page_key: string
          meta_title?: string | null
          meta_description?: string | null
          keywords?: string[]
          og_image?: string | null
          canonical?: string | null
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['seo_pages']['Insert']>
        Relationships: []
      }
      redirects: {
        Row: { id: string; from_path: string; to_path: string; is_permanent: boolean; created_at: string }
        Insert: { id?: string; from_path: string; to_path: string; is_permanent?: boolean; created_at?: string }
        Update: Partial<Database['public']['Tables']['redirects']['Insert']>
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          role: Database['public']['Enums']['user_role']
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          role?: Database['public']['Enums']['user_role']
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: []
      }
      enquiries: {
        Row: {
          id: string
          name: string
          phone: string
          email: string | null
          preferred_contact: Database['public']['Enums']['contact_preference']
          channel: Database['public']['Enums']['enquiry_channel']
          enquiry_type: Database['public']['Enums']['enquiry_type']
          product_id: string | null
          subject: string | null
          message: string | null
          preferred_date: string | null
          children_count: number | null
          status: Database['public']['Enums']['enquiry_status']
          assigned_to: string | null
          contacted_at: string | null
          converted_at: string | null
          outcome_reason: string | null
          estimated_value: number | null
          source_page: string | null
          referrer: string | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          phone: string
          email?: string | null
          preferred_contact?: Database['public']['Enums']['contact_preference']
          channel?: Database['public']['Enums']['enquiry_channel']
          enquiry_type?: Database['public']['Enums']['enquiry_type']
          product_id?: string | null
          subject?: string | null
          message?: string | null
          preferred_date?: string | null
          children_count?: number | null
          status?: Database['public']['Enums']['enquiry_status']
          assigned_to?: string | null
          contacted_at?: string | null
          converted_at?: string | null
          outcome_reason?: string | null
          estimated_value?: number | null
          source_page?: string | null
          referrer?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['enquiries']['Insert']>
        Relationships: []
      }
      enquiry_notes: {
        Row: { id: string; enquiry_id: string; note: string; created_by: string | null; created_at: string }
        Insert: { id?: string; enquiry_id: string; note: string; created_by?: string | null; created_at?: string }
        Update: Partial<Database['public']['Tables']['enquiry_notes']['Insert']>
        Relationships: []
      }
      audit_log: {
        Row: {
          id: string
          actor_id: string | null
          action: Database['public']['Enums']['audit_action']
          table_name: string
          row_id: string | null
          diff: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          actor_id?: string | null
          action: Database['public']['Enums']['audit_action']
          table_name: string
          row_id?: string | null
          diff?: Json | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['audit_log']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      is_staff: { Args: Record<string, never>; Returns: boolean }
      is_admin: { Args: Record<string, never>; Returns: boolean }
    }
    Enums: {
      price_display: 'show' | 'hide' | 'enquire'
      enquiry_type: 'product' | 'play_area' | 'contact' | 'general'
      enquiry_status: 'new' | 'contacted' | 'in_progress' | 'converted' | 'lost'
      enquiry_channel: 'web_form' | 'whatsapp' | 'phone' | 'email'
      contact_preference: 'phone' | 'whatsapp' | 'email' | 'any'
      audit_action: 'insert' | 'update' | 'delete'
      nav_location: 'header' | 'footer_quick' | 'footer_category'
      user_role: 'admin' | 'editor' | 'viewer'
    }
    CompositeTypes: Record<string, never>
  }
}

/* ------------------------------------------------------------------ */
/* Convenience helpers (standard Supabase pattern)                    */
/* ------------------------------------------------------------------ */
type PublicSchema = Database['public']

export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row']
export type TablesInsert<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Update']
export type Enums<T extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][T]
