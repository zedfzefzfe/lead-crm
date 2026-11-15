import { Badge } from '@/components/ui/badge'
import { APPT_STATUS_BADGE, APPT_STATUS_LABEL, CITY_BADGE, CITY_LABEL, STAGE_DOT, STAGE_LABEL } from '@/lib/labels'
import type { ApptStatus, City, Stage } from '@/lib/types'
import { cn } from '@/lib/utils'

export const CityBadge = ({ city, className }: { city: City; className?: string }) => (
  <Badge className={cn(CITY_BADGE[city], className)}>{CITY_LABEL[city]}</Badge>
)

export const StageBadge = ({ stage }: { stage: Stage }) => (
  <Badge className="bg-secondary text-secondary-foreground">
    <span className={cn('size-2 rounded-full', STAGE_DOT[stage])} />
    {STAGE_LABEL[stage]}
  </Badge>
)

export const ApptStatusBadge = ({ status }: { status: ApptStatus }) => (
  <Badge className={APPT_STATUS_BADGE[status]}>{APPT_STATUS_LABEL[status]}</Badge>
)

export const RelanceBadge = () => <Badge className="bg-amber-100 text-amber-900">À relancer</Badge>
