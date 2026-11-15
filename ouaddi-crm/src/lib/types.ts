// Mirrors supabase/migrations/20261115_01_ouaddi_schema.sql
export type City = 'casablanca' | 'rabat' | 'autre'
export type LeadSource = 'meta_ads' | 'instagram_auto' | 'whatsapp' | 'referral' | 'autre'
export type Service = 'rideaux' | 'fauteuils' | 'les_deux'
export type Stage =
  | 'nouveau' | 'contacte' | 'rdv_mesures' | 'mesures_prises' | 'devis_envoye'
  | 'negociation' | 'gagne' | 'pose_planifiee' | 'termine' | 'perdu'
export type ApptType = 'mesures' | 'pose' | 'livraison' | 'visite'
export type ApptStatus = 'planifie' | 'confirme' | 'fait' | 'annule' | 'no_show'
export type ActivityType = 'note' | 'appel' | 'whatsapp' | 'rdv' | 'changement_statut'
export type TaskStatus = 'a_faire' | 'fait'
export type Role = 'admin' | 'agent'

export interface Profile {
  id: string
  full_name: string
  role: Role
  created_at: string
}

export interface Lead {
  id: string
  full_name: string
  phone: string
  city: City
  address: string | null
  source: LeadSource
  source_detail: string | null
  service: Service
  stage: Stage
  lost_reason: string | null
  estimated_value: number | null
  assigned_to: string | null
  notes: string
  created_at: string
  updated_at: string
}

// public.leads_overview
export interface LeadOverview extends Lead {
  last_activity_at: string
  next_appt_at: string | null
}

export interface Appointment {
  id: string
  lead_id: string
  type: ApptType
  scheduled_at: string
  duration_min: number
  city: City
  address: string | null
  status: ApptStatus
  assigned_to: string | null
  notes: string
  reminder_sent: boolean
  created_at: string
  updated_at: string
}

export interface AppointmentWithLead extends Appointment {
  lead: Pick<Lead, 'id' | 'full_name' | 'phone' | 'service'> | null
}

export interface Activity {
  id: string
  lead_id: string
  type: ActivityType
  content: string
  created_by: string | null
  created_at: string
}

export interface Task {
  id: string
  lead_id: string
  title: string
  due_date: string
  status: TaskStatus
  created_by: string | null
  created_at: string
}
