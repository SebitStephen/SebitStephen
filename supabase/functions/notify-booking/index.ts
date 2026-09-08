// Supabase Edge Function: notify-booking
//
// Called directly from the client right after a booking is created or its
// status changes. Emails the other side of the booking via Resend so
// nobody has to poll the app to find out a request came in, or was
// accepted/declined/completed. Silently no-ops if Resend isn't configured
// (see .env.example / README) so the MVP works without it.
//
// Required environment variables (set with `supabase secrets set`):
//   SUPABASE_URL               - injected automatically by Supabase
//   SUPABASE_SERVICE_ROLE_KEY  - injected automatically by Supabase
//   RESEND_API_KEY             - your Resend API key
//   NOTIFY_FROM_EMAIL          - verified "from" address, e.g. notify@yourdomain.com

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const FROM_EMAIL = Deno.env.get('NOTIFY_FROM_EMAIL') ?? 'notify@example.com'

interface NotifyPayload {
  type: 'new_booking' | 'status_change'
  booking_id: string
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  })
}

Deno.serve(async (req: Request) => {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Missing Supabase service credentials' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const { type, booking_id }: NotifyPayload = await req.json()
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('id, status, scheduled_at, customer_id, provider_id, service:services(title)')
      .eq('id', booking_id)
      .single()
    if (error || !booking) throw error ?? new Error('Booking not found')

    const [{ data: customerUser }, { data: providerUser }] = await Promise.all([
      supabaseAdmin.auth.admin.getUserById(booking.customer_id),
      supabaseAdmin.auth.admin.getUserById(booking.provider_id),
    ])

    const when = new Date(booking.scheduled_at).toLocaleString('en-US')
    const serviceTitle = (booking.service as unknown as { title: string } | null)?.title ?? 'your service'

    if (type === 'new_booking' && providerUser?.user?.email) {
      await sendEmail(
        providerUser.user.email,
        'New booking request',
        `<p>You have a new booking request for <strong>${serviceTitle}</strong> on ${when}. Open LocalPro to accept or decline it.</p>`,
      )
    }

    if (type === 'status_change' && customerUser?.user?.email) {
      await sendEmail(
        customerUser.user.email,
        `Booking ${booking.status}: ${serviceTitle}`,
        `<p>Your booking for <strong>${serviceTitle}</strong> on ${when} is now <strong>${booking.status}</strong>.</p>`,
      )
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
