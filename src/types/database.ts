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
      amiibo: {
        Row: {
          boite_path: string | null;
          cree_le: string;
          editeur: string;
          id: string;
          identifiant: string;
          image_path: string | null;
          nom: string;
          nom_jap: string | null;
          personnage: string | null;
          serie_amiibo: string | null;
          serie_jeux: string | null;
          slug: string;
          type: Database["public"]["Enums"]["amiibo_type"];
          updated_at: string;
          verrous: string[];
        };
        ComputedFields: never;
        Insert: {
          boite_path?: string | null;
          cree_le?: string;
          editeur?: string;
          id?: string;
          identifiant: string;
          image_path?: string | null;
          nom: string;
          nom_jap?: string | null;
          personnage?: string | null;
          serie_amiibo?: string | null;
          serie_jeux?: string | null;
          slug: string;
          type: Database["public"]["Enums"]["amiibo_type"];
          updated_at?: string;
          verrous?: string[];
        };
        Update: {
          boite_path?: string | null;
          cree_le?: string;
          editeur?: string;
          id?: string;
          identifiant?: string;
          image_path?: string | null;
          nom?: string;
          nom_jap?: string | null;
          personnage?: string | null;
          serie_amiibo?: string | null;
          serie_jeux?: string | null;
          slug?: string;
          type?: Database["public"]["Enums"]["amiibo_type"];
          updated_at?: string;
          verrous?: string[];
        };
        Relationships: [];
      };
      amiibo_exclus: {
        Row: {
          cree_le: string;
          identifiant: string;
          raison: string | null;
        };
        ComputedFields: never;
        Insert: {
          cree_le?: string;
          identifiant: string;
          raison?: string | null;
        };
        Update: {
          cree_le?: string;
          identifiant?: string;
          raison?: string | null;
        };
        Relationships: [];
      };
      amiibo_jeux: {
        Row: {
          amiibo_id: string;
          console: string;
          game_id: string | null;
          id: string;
          titre_jeu: string;
          usage: string | null;
        };
        ComputedFields: never;
        Insert: {
          amiibo_id: string;
          console: string;
          game_id?: string | null;
          id?: string;
          titre_jeu: string;
          usage?: string | null;
        };
        Update: {
          amiibo_id?: string;
          console?: string;
          game_id?: string | null;
          id?: string;
          titre_jeu?: string;
          usage?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "amiibo_jeux_amiibo_id_fkey";
            columns: ["amiibo_id"];
            isOneToOne: false;
            referencedRelation: "amiibo";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "amiibo_jeux_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      amiibo_sorties: {
        Row: {
          amiibo_id: string;
          date_sortie: string | null;
          precision_date: Database["public"]["Enums"]["precision_date"] | null;
          region: Database["public"]["Enums"]["region"];
        };
        ComputedFields: never;
        Insert: {
          amiibo_id: string;
          date_sortie?: string | null;
          precision_date?: Database["public"]["Enums"]["precision_date"] | null;
          region: Database["public"]["Enums"]["region"];
        };
        Update: {
          amiibo_id?: string;
          date_sortie?: string | null;
          precision_date?: Database["public"]["Enums"]["precision_date"] | null;
          region?: Database["public"]["Enums"]["region"];
        };
        Relationships: [
          {
            foreignKeyName: "amiibo_sorties_amiibo_id_fkey";
            columns: ["amiibo_id"];
            isOneToOne: false;
            referencedRelation: "amiibo";
            referencedColumns: ["id"];
          },
        ];
      };
      captures: {
        Row: {
          game_id: string;
          hauteur: number | null;
          largeur: number | null;
          position: number;
          url: string;
        };
        ComputedFields: never;
        Insert: {
          game_id: string;
          hauteur?: number | null;
          largeur?: number | null;
          position: number;
          url: string;
        };
        Update: {
          game_id?: string;
          hauteur?: number | null;
          largeur?: number | null;
          position?: number;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "captures_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
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
          metacritic_note: number | null;
          metacritic_url: string | null;
          physique: boolean;
          rawg_slug: string | null;
          series: string[];
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
          metacritic_note?: number | null;
          metacritic_url?: string | null;
          physique?: boolean;
          rawg_slug?: string | null;
          series?: string[];
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
          metacritic_note?: number | null;
          metacritic_url?: string | null;
          physique?: boolean;
          rawg_slug?: string | null;
          series?: string[];
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
      guides: {
        Row: {
          cree_le: string;
          date_parution: string | null;
          editeur: string | null;
          google_books_id: string | null;
          id: string;
          isbn: string;
          ndl_url: string | null;
          pages: number | null;
          precision_date: Database["public"]["Enums"]["precision_date"] | null;
          titre: string;
          updated_at: string;
          verrous: string[];
        };
        ComputedFields: never;
        Insert: {
          cree_le?: string;
          date_parution?: string | null;
          editeur?: string | null;
          google_books_id?: string | null;
          id?: string;
          isbn: string;
          ndl_url?: string | null;
          pages?: number | null;
          precision_date?: Database["public"]["Enums"]["precision_date"] | null;
          titre: string;
          updated_at?: string;
          verrous?: string[];
        };
        Update: {
          cree_le?: string;
          date_parution?: string | null;
          editeur?: string | null;
          google_books_id?: string | null;
          id?: string;
          isbn?: string;
          ndl_url?: string | null;
          pages?: number | null;
          precision_date?: Database["public"]["Enums"]["precision_date"] | null;
          titre?: string;
          updated_at?: string;
          verrous?: string[];
        };
        Relationships: [];
      };
      guides_exclus: {
        Row: {
          cree_le: string;
          isbn: string;
          raison: string | null;
        };
        ComputedFields: never;
        Insert: {
          cree_le?: string;
          isbn: string;
          raison?: string | null;
        };
        Update: {
          cree_le?: string;
          isbn?: string;
          raison?: string | null;
        };
        Relationships: [];
      };
      guides_jeux: {
        Row: {
          game_id: string;
          guide_id: string;
        };
        ComputedFields: never;
        Insert: {
          game_id: string;
          guide_id: string;
        };
        Update: {
          game_id?: string;
          guide_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "guides_jeux_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "guides_jeux_guide_id_fkey";
            columns: ["guide_id"];
            isOneToOne: false;
            referencedRelation: "guides";
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
      invitations: {
        Row: {
          cree_le: string;
          expire_le: string;
          id: string;
          jeton_hache: string;
          nom: string;
          user_id: string | null;
          utilisee_le: string | null;
        };
        ComputedFields: never;
        Insert: {
          cree_le?: string;
          expire_le?: string;
          id?: string;
          jeton_hache: string;
          nom: string;
          user_id?: string | null;
          utilisee_le?: string | null;
        };
        Update: {
          cree_le?: string;
          expire_le?: string;
          id?: string;
          jeton_hache?: string;
          nom?: string;
          user_id?: string | null;
          utilisee_le?: string | null;
        };
        Relationships: [];
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
      possessions_amiibo: {
        Row: {
          amiibo_id: string;
          cree_le: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          amiibo_id: string;
          cree_le?: string;
          user_id?: string;
        };
        Update: {
          amiibo_id?: string;
          cree_le?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "possessions_amiibo_amiibo_id_fkey";
            columns: ["amiibo_id"];
            isOneToOne: false;
            referencedRelation: "amiibo";
            referencedColumns: ["id"];
          },
        ];
      };
      profils: {
        Row: {
          avatar: string;
          cree_le: string;
          pseudo: string;
          public: boolean;
          role: Database["public"]["Enums"]["role_compte"];
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          avatar?: string;
          cree_le?: string;
          pseudo: string;
          public?: boolean;
          role?: Database["public"]["Enums"]["role_compte"];
          user_id: string;
        };
        Update: {
          avatar?: string;
          cree_le?: string;
          pseudo?: string;
          public?: boolean;
          role?: Database["public"]["Enums"]["role_compte"];
          user_id?: string;
        };
        Relationships: [];
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
      est_proprietaire: { Args: Record<PropertyKey, never>; Returns: boolean };
      profil_public: { Args: { p_pseudo: string }; Returns: Json };
    };
    Enums: {
      amiibo_type: "figurine" | "carte" | "peluche" | "bracelet" | "bloc";
      console_type: "salon" | "portable";
      jaquette_source:
        | "gametdb"
        | "igdb"
        | "libretro"
        | "gamecartdb"
        | "nintendo"
        | "screenscraper"
        | "photo"
        | "url";
      precision_date: "jour" | "mois" | "annee";
      region: "JAP" | "US" | "PAL";
      role_compte: "proprietaire" | "collectionneur";
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
      amiibo_type: ["figurine", "carte", "peluche", "bracelet", "bloc"],
      console_type: ["salon", "portable"],
      jaquette_source: [
        "gametdb",
        "igdb",
        "libretro",
        "gamecartdb",
        "nintendo",
        "screenscraper",
        "photo",
        "url",
      ],
      precision_date: ["jour", "mois", "annee"],
      region: ["JAP", "US", "PAL"],
      role_compte: ["proprietaire", "collectionneur"],
    },
  },
} as const;
