/** Types mirroring the Django REST API (`/api/`). Decimals arrive as strings. */

export type TechnologyIcon = 'fdm' | 'sla' | 'sls';

export interface TechnologyBrief {
  id: number;
  name: string;
  slug: string;
  icon_name: TechnologyIcon | string;
  tolerance_label: string;
}

export interface PrintTechnology extends TechnologyBrief {
  short_summary: string;
  max_build_volume: string;
  min_layer_height: string;
  typical_lead_time: string;
  display_order: number;
  material_count: number;
}

export interface PrintMaterial {
  id: number;
  name: string;
  slug: string;
  technology: TechnologyBrief;
  short_description: string;
  properties_tags: string[];
  available_colors: string[];
  price_per_gram_eur: string;
  setup_fee_eur: string;
  tensile_strength_mpa: number | null;
  max_temp_celsius: number | null;
  is_featured: boolean;
}

export interface PrintMaterialDetail extends Omit<PrintMaterial, 'technology'> {
  technology: PrintTechnology;
  detailed_description: string;
  applications: string[];
  density_g_cm3: string | null;
}

export interface PortfolioProject {
  id: number;
  title: string;
  slug: string;
  technology: TechnologyBrief;
  material: { id: number; name: string; slug: string } | null;
  client_sector: string;
  challenge_summary: string;
  production_specs: string;
  quantity_produced: number;
  image_url: string;
  is_featured: boolean;
}

export type InfillLevel = 'standard' | 'reinforced' | 'solid';
export type PostProcessing = 'none' | 'sanding_painting' | 'threaded_inserts';
export type ClientType = 'firma' | 'sukromna_osoba';
export type CadServiceType = 'cad_navrh' | 'reverzne_inzinierstvo' | '3d_skenovanie';

export interface QuoteRequestPayload {
  technology?: string | null;
  material?: string | null;
  model_file?: File | null;
  external_file_link?: string;
  quantity: number;
  desired_color?: string;
  infill_level: InfillLevel;
  post_processing: PostProcessing;
  client_type: ClientType;
  company_name?: string;
  client_name: string;
  email: string;
  phone?: string;
  notes?: string;
}

export interface CadRequestPayload {
  service_type: CadServiceType;
  description: string;
  client_name: string;
  email: string;
  phone?: string;
}

export interface CreatedResponse {
  id: number;
  created_at: string;
}

/** DRF validation error body: field → messages. */
export type ApiFieldErrors = Record<string, string[] | string>;

export interface MaterialQuery {
  technology?: string;
  featured?: boolean;
  search?: string;
  ordering?: string;
}

export interface PortfolioQuery {
  technology?: string;
  featured?: boolean;
}
