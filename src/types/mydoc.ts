export type PropertyType = 'VENTE' | 'LOCATION' | 'GESTION' | 'DIVERS';
export type PropertyStatus = 'OPEN' | 'COMPLETE' | 'ARCHIVED';
export type MandateStatus = 'SIGNED' | 'PENDING';

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  VENTE: 'Vente',
  LOCATION: 'Location',
  GESTION: 'Gestion',
  DIVERS: 'Divers',
};

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  OPEN: 'En cours',
  COMPLETE: 'Complet',
  ARCHIVED: 'Archivé',
};

export const PROPERTY_TYPE_COLORS: Record<PropertyType, string> = {
  VENTE: 'bg-blue-100 text-blue-700',
  LOCATION: 'bg-emerald-100 text-emerald-700',
  GESTION: 'bg-amber-100 text-amber-700',
  DIVERS: 'bg-gray-100 text-gray-600',
};

export const PROPERTY_STATUS_COLORS: Record<PropertyStatus, string> = {
  OPEN: 'bg-blue-50 text-blue-600',
  COMPLETE: 'bg-emerald-50 text-emerald-600',
  ARCHIVED: 'bg-gray-100 text-gray-500',
};

export interface PropertyFile {
  id: string;
  reference: string;
  type: PropertyType;
  address: string;
  city: string;
  postal_code: string | null;
  owner_name: string;
  agent_id: string | null;
  status: PropertyStatus;
  mandate_number: string | null;
  mandate_status: MandateStatus | null;
  is_copro: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyFileDocument {
  id: string;
  property_file_id: string;
  category: string;
  document_type: string | null;
  filename: string;
  file_size: number | null;
  mime_type: string | null;
  storage_path: string | null;
  uploader_id: string | null;
  uploaded_at: string;
}

export interface ChecklistItem {
  id: string;
  property_type: PropertyType;
  label: string;
  category: string;
  required: boolean;
  order_index: number;
  active: boolean;
  created_at: string;
}
