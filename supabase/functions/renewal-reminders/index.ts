// Supabase Edge Function: renewal-reminders
//
// Runs on a schedule (see supabase/README.md for cron setup) and emails every
// user whose subscription renews in REMINDER_DAYS days, using Resend.
//
// Required environment variables (set with `supabase secrets set`):
//   SUPABASE_URL               - injected automatically by Supabase
//   SUPABASE_SERVICE_ROLE_KEY  - injected automatically by Supabase
//   RESEND_API_KEY             - your Resend API key
//   REMINDER_FROM_EMAIL        - verified "from" address, e.g. reminders@yourdomain.com

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const FROM_EMAIL = Deno.env.get('REMINDER_FROM_EMAIL') ?? 'reminders@example.com'
const REMINDER_DAYS = 3

interface SubscriptionRow {
  id: string
  user_id: string
  name: string
  cost: number
  billing_cycle: string
  renewal_date: string
}

Deno.serve(async (req: Request) => {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Missing Supabase service credentials' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    const target = new Date()
    target.setUTCDate(target.getUTCDate() + REMINDER_DAYS)
    const targetDate = target.toISOString().slice(0, 10)

    const { data: subs, error } = await supabaseAdmin
      .from('subscriptions')
      .select('id, user_id, name, cost, billing_cycle, renewal_date')
      .eq('status', 'active')
      .eq('renewal_date', targetDate)
      .returns<SubscriptionRow[]>()

    if (error) throw error
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ sent: 0, checked: targetDate }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const userIds = [...new Set(subs.map((s) => s.user_id))]
    const emailByUser = new Map<string, string>()
    for (const id of userIds) {
      const { data, error: userError } = await supabaseAdmin.auth.admin.getUserById(id)
      if (!userError && data.user?.email) {
        emailByUser.set(id, data.user.email)
      }
    }

    let sent = 0
    for (const sub of subs) {
      const email = emailByUser.get(sub.user_id)
      if (!email || !RESEND_API_KEY) continue

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: email,
          subject: `Renewing in ${REMINDER_DAYS} days: ${sub.name}`,
          html: `<p>Heads up — <strong>${sub.name}</strong> renews on ${sub.renewal_date} for $${sub.cost} (${sub.billing_cycle}).</p><p>Open your AI Subscription Tracker to cancel it or log a check-in before you're charged again.</p>`,
        }),
      })

      if (res.ok) sent++
    }

    return new Response(JSON.stringify({ sent, total: subs.length, checked: targetDate }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
