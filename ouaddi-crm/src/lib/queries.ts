import { supabase } from './supabase'
import { must } from './live'
import { CLOSED_STAGES } from './labels'
import { daysSince } from './dates'
import type { AppointmentWithLead, LeadOverview } from './types'

export const APPT_SELECT = '*, lead:leads(id, full_name, phone, service)'

export async function fetchLeads() {
  return must(await supabase.from('leads_overview').select('*').order('created_at', { ascending: false })) as LeadOverview[]
}

/** Rendez-vous between two instants (ISO), with the client's name. */
export async function fetchAppointments(fromIso: string, toIso: string) {
  return must(
    await supabase.from('appointments').select(APPT_SELECT)
      .gte('scheduled_at', fromIso).lt('scheduled_at', toIso)
      .order('scheduled_at'),
  ) as AppointmentWithLead[]
}

/** No activity for more than 3 days and still open -> "à relancer". */
export const needsFollowUp = (l: LeadOverview) =>
  !CLOSED_STAGES.includes(l.stage) && daysSince(l.last_activity_at) > 3
