# n8n booking automation

Laravel is the source of truth for booking availability, prices, payment calculations, proof storage, and status changes. n8n receives events only after Laravel commits those changes.

## Environment variables

Configure these in the Laravel environment:

```dotenv
N8N_BOOKING_SUBMITTED_WEBHOOK_URL=https://your-n8n.example/webhook/booking-submitted
N8N_BOOKING_STATUS_WEBHOOK_URL=https://your-n8n.example/webhook/booking-status
N8N_WEBHOOK_SECRET=replace-with-a-long-random-secret
N8N_WEBHOOK_TIMEOUT=5
```

Both n8n Webhook nodes should validate the `X-Webhook-Secret` header before processing the payload. Webhook failures are logged and do not roll back a booking that Laravel already saved.

## Submitted-booking workflow

The submitted endpoint receives `event: booking.submitted` and `calendar_action: none`.

1. Use a Gmail node to notify the resort owner. Include `booking_reference`, customer contact fields, reservation fields, amounts, and both statuses. State clearly that the proof still requires manual verification. Link `admin_review_url` so the owner can sign in and inspect the private proof.
2. Use Google Sheets “Append row” to back up the booking payload. Use `booking_reference` as the external idempotency key so retries do not create duplicate records.
3. Do not add a Google Calendar node to this workflow.

## Status workflow

The status endpoint receives `event: booking.status_changed`.

- When `calendar_action` is `create_or_update`, upsert a Calendar event using the booking reference in the title/description and store the Calendar event ID alongside the reference in the backup sheet or an n8n data store.
- When `calendar_action` is `remove`, find the Calendar event by the stored reference/event ID and delete it. Treat “event already absent” as an idempotent success.
- Update the matching Google Sheets row with the new booking and payment statuses.

The payload intentionally contains only `proof_of_payment_submitted: true/false` and an authenticated `admin_review_url`; the private proof image itself is not exposed to n8n.
