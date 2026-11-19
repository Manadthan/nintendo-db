export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      consoles: {
        Row: {
          annee: number;
          id: string;
          igdb_platform_id: number | null;
          nom: string;
          ordre: number;
          slug: string;
          type: Database["public"]["Enums"]["console_type"];
          wikipedia_liste: string | null;
        };
        ComputedFields: never;
        Insert: {
          annee: number;
          id?: string;
          igdb_platform_id?: number | null;
          nom: string;
          ordre: number;
          slug: string;
          type: Database["public"]["Enums"]["console_type"];
          wikipedia_liste?: string | null;
        };
        Update: {
          annee?: number;
          id?: string;
          igdb_platform_id?: number | null;
          nom?: string;
          ordre?: number;
          slug?: string;
          type?: Database["public"]["Enums"]["console_type"];
          wikipedia_liste?: string | null;
        };
        Relationships: [];
      };
      exclusions: {
        Row: {
          console_id: string;
          cree_le: string;
          raison: string;
          slug: string;
          titre: string;
        };
        ComputedFields: never;
        Insert: {
          console_id: string;
          cree_le?: string;
          raison?: string;
          slug: string;
          titre: string;
        };
        Update: {
          console_id?: string;
          cree_le?: string;
          raison?: string;
          slug?: string;
          titre?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exclusions_console_id_fkey";
            columns: ["console_id"];
            isOneToOne: false;
            referencedRelation: "consoles";
            referencedColumns: ["id"];
          },
        ];
      };
      games: {
        Row: {
          console_id: string;
          created_at: string;
          developpeur: string | null;
          franchise: string | null;
          genre: string | null;
          id: string;
          igdb_id: number | null;
          physique: boolean;
          slug: string;
          updated_at: string;
          verrous: string[];
          wikipedia_url: string | null;
        };
        ComputedFields: never;
        Insert: {
          console_id: string;
          created_at?: string;
          developpeur?: string | null;
          franchise?: string | null;
          genre?: string | null;
          id?: string;
          igdb_id?: number | null;
          physique?: boolean;
          slug: string;
          updated_at?: string;
          verrous?: string[];
          wikipedia_url?: string | null;
        };
        Update: {
          console_id?: string;
          created_at?: string;
          developpeur?: string | null;
          franchise?: string | null;
          genre?: string | null;
          id?: string;
          igdb_id?: number | null;
          physique?: boolean;
          slug?: string;
          updated_at?: string;
          verrous?: string[];
          wikipedia_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "games_console_id_fkey";
            columns: ["console_id"];
            isOneToOne: false;
            referencedRelation: "consoles";
            referencedColumns: ["id"];
          },
        ];
      };
      import_runs: {
        Row: {
          console_id: string;
          id: string;
          lance_le: string;
          resume: NonNullable<Json>;
        };
        ComputedFields: never;
        Insert: {
          console_id: string;
          id?: string;
          lance_le?: string;
          resume?: NonNullable<Json>;
        };
        Update: {
          console_id?: string;
          id?: string;
          lance_le?: string;
          resume?: NonNullable<Json>;
        };
        Relationships: [
          {
            foreignKeyName: "import_runs_console_id_fkey";
            columns: ["console_id"];
            isOneToOne: false;
            referencedRelation: "consoles";
            referencedColumns: ["id"];
          },
        ];
      };
      possessions: {
        Row: {
          cree_le: string;
          game_id: string;
          region: Database["public"]["Enums"]["region"];
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          cree_le?: string;
          game_id: string;
          region: Database["public"]["Enums"]["region"];
          user_id?: string;
        };
        Update: {
          cree_le?: string;
          game_id?: string;
          region?: Database["public"]["Enums"]["region"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "possessions_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      releases: {
        Row: {
          code_produit: string | null;
          date_sortie: string | null;
          editeur: string | null;
          game_id: string;
          id: string;
          jaquette_path: string | null;
          jaquette_source:
            Database["public"]["Enums"]["jaquette_source"] | null;
          precision_date: Database["public"]["Enums"]["precision_date"] | null;
          region: Database["public"]["Enums"]["region"];
          sortie: boolean;
          titre: string | null;
          titre_romanise: string | null;
          updated_at: string;
          verrous: string[];
        };
        ComputedFields: never;
        Insert: {
          code_produit?: string | null;
          date_sortie?: string | null;
          editeur?: string | null;
          game_id: string;
          id?: string;
          jaquette_path?: string | null;
          jaquette_source?:
            Database["public"]["Enums"]["jaquette_source"] | null;
          precision_date?: Database["public"]["Enums"]["precision_date"] | null;
          region: Database["public"]["Enums"]["region"];
          sortie?: boolean;
          titre?: string | null;
          titre_romanise?: string | null;
          updated_at?: string;
          verrous?: string[];
        };
        Update: {
          code_produit?: string | null;
          date_sortie?: string | null;
          editeur?: string | null;
          game_id?: string;
          id?: string;
          jaquette_path?: string | null;
          jaquette_source?:
            Database["public"]["Enums"]["jaquette_source"] | null;
          precision_date?: Database["public"]["Enums"]["precision_date"] | null;
          region?: Database["public"]["Enums"]["region"];
          sortie?: boolean;
          titre?: string | null;
          titre_romanise?: string | null;
          updated_at?: string;
          verrous?: string[];
        };
        Relationships: [
          {
            foreignKeyName: "releases_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      console_type: "salon" | "portable";
      jaquette_source: "gametdb" | "igdb" | "libretro" | "photo" | "url";
      precision_date: "jour" | "mois" | "annee";
      region: "JAP" | "US" | "PAL";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      console_type: ["salon", "portable"],
      jaquette_source: ["gametdb", "igdb", "libretro", "photo", "url"],
      precision_date: ["jour", "mois", "annee"],
      region: ["JAP", "US", "PAL"],
    },
  },
} as const;
