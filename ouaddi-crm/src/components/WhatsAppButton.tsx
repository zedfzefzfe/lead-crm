import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { defaultWhatsappText, whatsappUrl } from '@/lib/phone'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

// Opens WhatsApp with a ready message and notes it in the lead's timeline.
export function WhatsAppButton({
  leadId, phone, fullName, text, compact, className,
}: {
  leadId: string
  phone: string
  fullName: string
  text?: string
  compact?: boolean
  className?: string
}) {
  const href = whatsappUrl(phone, text ?? defaultWhatsappText(fullName))
  const log = () => {
    supabase.from('activities').insert({ lead_id: leadId, type: 'whatsapp', content: 'WhatsApp ouvert depuis le CRM' }).then(() => {})
  }
  return (
    <Button asChild variant="whatsapp" size={compact ? 'icon' : 'default'} className={cn(compact && 'size-10', className)}>
      <a href={href} target="_blank" rel="noreferrer" onClick={e => { e.stopPropagation(); log() }} aria-label="WhatsApp">
        <MessageCircle />
        {!compact && 'WhatsApp'}
      </a>
    </Button>
  )
}
