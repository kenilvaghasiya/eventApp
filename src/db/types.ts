export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          sport_type: string;
          event_at: string;
          description: string | null;
          image_url: string | null;
          image_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          sport_type: string;
          event_at: string;
          description?: string | null;
          image_url?: string | null;
          image_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          sport_type?: string;
          event_at?: string;
          description?: string | null;
          image_url?: string | null;
          image_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      venues: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          address: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          address: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          address?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      event_venues: {
        Row: {
          event_id: string;
          venue_id: string;
          created_at: string;
        };
        Insert: {
          event_id: string;
          venue_id: string;
          created_at?: string;
        };
        Update: {
          event_id?: string;
          venue_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      sports: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type EventRow = Database["public"]["Tables"]["events"]["Row"];
export type VenueRow = Database["public"]["Tables"]["venues"]["Row"];

export type EventWithVenues = EventRow & {
  venues: VenueRow[];
};
