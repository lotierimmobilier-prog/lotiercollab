export type ClientType = 'individual' | 'legal_entity';
export type ClientRole = 'vendeur' | 'acquereur' | 'bailleur' | 'locataire' | 'caution';
export type RiskLevel = 'low' | 'medium' | 'high' | 'very_high';
export type DoubtLevel = 'none' | 'low' | 'medium' | 'high';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'open' | 'under_review' | 'closed' | 'reported';
export type DeclarationStatus = 'draft' | 'submitted' | 'acknowledged';
export type TransactionType = 'sale' | 'purchase' | 'rental';
export type TransactionStatus = 'in_progress' | 'completed' | 'cancelled';
export type DossierType = 'sale' | 'purchase' | 'rental' | 'management' | 'other';
export type DossierStatus = 'open' | 'in_progress' | 'pending_review' | 'complete' | 'archived';

export interface TracfinClient {
  id: string;
  created_by: string | null;
  agent_id?: string | null;
  client_type: ClientType;
  role: ClientRole;
  civility?: string;
  first_name?: string;
  last_name?: string;
  birth_date?: string;
  birth_place?: string;
  nationality?: string;
  company_name?: string;
  siret?: string;
  legal_form?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country: string;
  profession?: string;
  employer?: string;
  income_range?: string;
  income_source?: string;
  is_ppe: boolean;
  ppe_details?: string;
  risk_level: RiskLevel;
  doubt_level: DoubtLevel;
  status: 'active' | 'archived';
  is_draft: boolean;
  kyc_completed: boolean;
  kyc_date?: string;
  signature_data?: string;
  signed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TracfinBeneficialOwner {
  id: string;
  client_id: string;
  first_name: string;
  last_name: string;
  birth_date?: string;
  nationality?: string;
  ownership_percentage?: number;
  is_ppe: boolean;
  ppe_details?: string;
  id_document_type?: string;
  id_document_number?: string;
  created_at: string;
}

export type PartyRole = 'vendeur' | 'acquereur' | 'bailleur' | 'locataire' | 'caution';

export interface TracfinTransactionParty {
  id: string;
  transaction_id: string;
  client_id: string;
  party_role: PartyRole;
  created_at: string;
  client?: TracfinClient;
}

export interface TracfinTransaction {
  id: string;
  created_by: string | null;
  client_id?: string;
  agent_id?: string | null;
  transaction_type: TransactionType;
  status: TransactionStatus;
  property_address?: string;
  property_type?: string;
  amount?: number;
  currency: string;
  payment_method?: string;
  funds_origin?: string;
  third_party_involved: boolean;
  third_party_details?: string;
  unusual_urgency: boolean;
  suspension_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  client?: TracfinClient;
  parties?: TracfinTransactionParty[];
  agent?: { id: string; full_name: string } | null;
}

export const PARTY_ROLE_LABELS: Record<PartyRole, string> = {
  vendeur: 'Vendeur',
  acquereur: 'Acquéreur',
  bailleur: 'Bailleur',
  locataire: 'Locataire',
  caution: 'Caution',
};

export interface TracfinRiskAssessment {
  id: string;
  created_by: string | null;
  entity_type: 'client' | 'transaction';
  entity_id: string;
  score_income_coherence: number;
  score_funds_origin: number;
  score_third_parties: number;
  score_legal_structure: number;
  score_geographic_risk: number;
  score_payment_method: number;
  risk_level: RiskLevel;
  notes?: string;
  created_at: string;
  updated_at: string;
  client?: TracfinClient;
}

export interface TracfinAlert {
  id: string;
  created_by: string | null;
  client_id?: string;
  transaction_id?: string;
  alert_type: string;
  severity: AlertSeverity;
  title: string;
  description?: string;
  status: AlertStatus;
  resolved_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  client?: TracfinClient;
}

export interface TracfinDeclaration {
  id: string;
  created_by: string | null;
  client_id?: string;
  transaction_id?: string;
  operation_nature?: string;
  operation_amount?: number;
  operation_date?: string;
  operation_currency: string;
  payment_method?: string;
  funds_origin?: string;
  suspicion_reason: string;
  suspicion_detected_at?: string;
  observed_facts?: string;
  inconsistencies?: string;
  indicator_refused_documents: boolean;
  indicator_large_cash: boolean;
  indicator_income_inconsistency: boolean;
  indicator_complex_structure: boolean;
  indicator_unusual_urgency: boolean;
  indicator_unknown_third_party: boolean;
  indicator_foreign_account: boolean;
  property_address?: string;
  property_type?: string;
  agency_name?: string;
  agency_address?: string;
  agency_rcs?: string;
  declarant_name?: string;
  declarant_role?: string;
  declarant_phone?: string;
  declarant_email?: string;
  signature_data?: string;
  signed_at?: string;
  status: DeclarationStatus;
  submitted_at?: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  client?: TracfinClient;
}

export interface TracfinDossier {
  id: string;
  created_by: string | null;
  client_id: string | null;
  transaction_id?: string;
  dossier_type: DossierType;
  status: DossierStatus;
  reference: string;
  property_address?: string;
  property_type?: string;
  transaction_amount?: number;
  deadline?: string;
  kyc_verified: boolean;
  risk_assessed: boolean;
  documents_complete: boolean;
  beneficial_owners_verified: boolean;
  verified_at?: string;
  archived_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  client?: TracfinClient;
}

export const ROLE_LABELS: Record<ClientRole, string> = {
  vendeur: 'Vendeur',
  acquereur: 'Acquéreur',
  bailleur: 'Bailleur',
  locataire: 'Locataire',
  caution: 'Caution',
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  low: 'Faible',
  medium: 'Moyen',
  high: 'Élevé',
  very_high: 'Très élevé',
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  sale: 'Vente',
  purchase: 'Acquisition',
  rental: 'Location',
};

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  in_progress: 'En cours',
  completed: 'Finalisée',
  cancelled: 'Annulée',
};

export const ALERT_SEVERITY_LABELS: Record<AlertSeverity, string> = {
  low: 'Faible',
  medium: 'Moyen',
  high: 'Élevé',
  critical: 'Critique',
};

export const ALERT_STATUS_LABELS: Record<AlertStatus, string> = {
  open: 'Ouverte',
  under_review: 'En cours d\'analyse',
  closed: 'Clôturée',
  reported: 'Déclarée',
};

export const DECLARATION_STATUS_LABELS: Record<DeclarationStatus, string> = {
  draft: 'Brouillon',
  submitted: 'Soumise',
  acknowledged: 'Accusée de réception',
};

export const DOSSIER_TYPE_LABELS: Record<DossierType, string> = {
  sale: 'Vente',
  purchase: 'Acquisition',
  rental: 'Location',
  management: 'Gestion',
  other: 'Autre',
};

export const DOSSIER_STATUS_LABELS: Record<DossierStatus, string> = {
  open: 'Ouvert',
  in_progress: 'En cours',
  pending_review: 'En révision',
  complete: 'Complet',
  archived: 'Archivé',
};
