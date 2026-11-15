import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input, Select } from '@/components/ui/input'
import { PageTitle } from '@/components/Layout'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/lib/toast'
import type { Profile, Role } from '@/lib/types'

// Admin: team members and their role. New members: Supabase > Authentication > Add user.
export default function Team() {
  const { profiles, profile: me, isAdmin, reloadProfiles } = useAuth()
  const toast = useToast()

  async function save(p: Profile, patch: Partial<Pick<Profile, 'full_name' | 'role'>>) {
    const { error } = await supabase.from('profiles').update(patch).eq('id', p.id)
    if (error) toast(error.message, true)
    else toast('Enregistré')
    reloadProfiles()
  }

  if (!isAdmin) return <p className="py-10 text-center text-muted-foreground">Réservé aux admins.</p>

  return (
    <>
      <PageTitle title="Équipe" />
      <Card className="mb-4">
        <CardContent className="space-y-1 pt-4 text-sm text-muted-foreground">
          <p><strong className="text-foreground">Ajouter quelqu'un :</strong> Supabase → Authentication → Users → Add user (email + mot de passe, « Auto confirm »).</p>
          <p>Il apparaît ici automatiquement en tant qu'<em>agent</em>. Un agent peut tout faire sauf supprimer un lead ou changer les rôles.</p>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {profiles.map(p => <Row key={p.id} p={p} isMe={p.id === me?.id} onSave={save} />)}
      </div>
    </>
  )
}

function Row({ p, isMe, onSave }: { p: Profile; isMe: boolean; onSave: (p: Profile, patch: Partial<Pick<Profile, 'full_name' | 'role'>>) => void }) {
  const [name, setName] = useState(p.full_name)
  return (
    <div className="grid grid-cols-[1fr_8rem] items-center gap-2 rounded-xl border bg-card p-3">
      <Input value={name} onChange={e => setName(e.target.value)} onBlur={() => name.trim() && name !== p.full_name && onSave(p, { full_name: name.trim() })} />
      <Select value={p.role} disabled={isMe} title={isMe ? 'Tu ne peux pas changer ton propre rôle' : undefined}
        onChange={e => onSave(p, { role: e.target.value as Role })}>
        <option value="admin">Admin</option>
        <option value="agent">Agent</option>
      </Select>
    </div>
  )
}
