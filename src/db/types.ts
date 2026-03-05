export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          timezone: string | null;
          last_seen_at: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          timezone?: string | null;
          last_seen_at?: string;
          created_at?: string;
        };
        Update: {
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          timezone?: string | null;
          last_seen_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          key_prefix: string;
          owner_id: string;
          color: string | null;
          emoji: string | null;
          archived: boolean;
          start_date: string | null;
          end_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          key_prefix: string;
          owner_id: string;
          color?: string | null;
          emoji?: string | null;
          archived?: boolean;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          key_prefix?: string;
          color?: string | null;
          emoji?: string | null;
          archived?: boolean;
          start_date?: string | null;
          end_date?: string | null;
        };
        Relationships: [];
      };
      project_members: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["member_role"];
          invited_at: string;
          joined_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          role?: Database["public"]["Enums"]["member_role"];
          invited_at?: string;
          joined_at?: string | null;
        };
        Update: {
          role?: Database["public"]["Enums"]["member_role"];
          joined_at?: string | null;
        };
        Relationships: [];
      };
      invitations: {
        Row: {
          id: string;
          project_id: string;
          email: string;
          token: string;
          role: Database["public"]["Enums"]["invite_role"];
          expires_at: string;
          accepted_at: string | null;
          invited_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          email: string;
          token: string;
          role?: Database["public"]["Enums"]["invite_role"];
          expires_at: string;
          accepted_at?: string | null;
          invited_by: string;
          created_at?: string;
        };
        Update: {
          accepted_at?: string | null;
          expires_at?: string;
        };
        Relationships: [];
      };
      tickets: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string | null;
          status: Database["public"]["Enums"]["ticket_status"];
          priority: Database["public"]["Enums"]["ticket_priority"];
          type: Database["public"]["Enums"]["ticket_type"];
          assignee_id: string | null;
          reporter_id: string;
          parent_id: string | null;
          sprint_id: string | null;
          due_date: string | null;
          estimate: number | null;
          ticket_number: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string | null;
          status?: Database["public"]["Enums"]["ticket_status"];
          priority?: Database["public"]["Enums"]["ticket_priority"];
          type?: Database["public"]["Enums"]["ticket_type"];
          assignee_id?: string | null;
          reporter_id: string;
          parent_id?: string | null;
          sprint_id?: string | null;
          due_date?: string | null;
          estimate?: number | null;
          ticket_number?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          status?: Database["public"]["Enums"]["ticket_status"];
          priority?: Database["public"]["Enums"]["ticket_priority"];
          type?: Database["public"]["Enums"]["ticket_type"];
          assignee_id?: string | null;
          due_date?: string | null;
          estimate?: number | null;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          ticket_id: string;
          author_id: string;
          body: string;
          edited_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          author_id: string;
          body: string;
          edited_at?: string | null;
          created_at?: string;
        };
        Update: {
          body?: string;
          edited_at?: string | null;
        };
        Relationships: [];
      };
      ticket_attachments: {
        Row: {
          id: string;
          ticket_id: string;
          uploaded_by: string;
          file_name: string;
          file_url: string;
          storage_path: string;
          content_type: string | null;
          file_size: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          uploaded_by: string;
          file_name: string;
          file_url: string;
          storage_path: string;
          content_type?: string | null;
          file_size?: number | null;
          created_at?: string;
        };
        Update: {
          file_name?: string;
          file_url?: string;
          storage_path?: string;
          content_type?: string | null;
          file_size?: number | null;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          project_id: string;
          sender_id: string;
          body: string;
          file_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          sender_id: string;
          body: string;
          file_url?: string | null;
          created_at?: string;
        };
        Update: {
          body?: string;
          file_url?: string | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          reference_id: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          reference_id?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          read?: boolean;
        };
        Relationships: [];
      };
      direct_messages: {
        Row: {
          id: string;
          sender_id: string;
          recipient_id: string;
          body: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          recipient_id: string;
          body: string;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          body?: string;
          read_at?: string | null;
        };
        Relationships: [];
      };
      sprints: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          start_date: string | null;
          end_date: string | null;
          status: Database["public"]["Enums"]["sprint_status"];
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          start_date?: string | null;
          end_date?: string | null;
          status?: Database["public"]["Enums"]["sprint_status"];
          created_at?: string;
        };
        Update: {
          name?: string;
          start_date?: string | null;
          end_date?: string | null;
          status?: Database["public"]["Enums"]["sprint_status"];
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
      member_role: "owner" | "admin" | "developer" | "viewer";
      invite_role: "admin" | "developer" | "viewer";
      ticket_status: "backlog" | "todo" | "in_progress" | "in_review" | "done" | "cancelled";
      ticket_priority: "critical" | "high" | "medium" | "low" | "none";
      ticket_type: "bug" | "feature" | "task" | "improvement" | "question" | "epic";
      sprint_status: "planned" | "active" | "completed";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
