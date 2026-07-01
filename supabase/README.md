# Supabase Setup

Tiny version:

1. Create a new Supabase project.
2. Go to `SQL Editor`.
3. Paste/run `supabase/schema.sql`.
4. Go to `Project Settings -> API`.
5. Copy your project URL and publishable key.
6. Replace the old values in:
   - `product/index.html`
   - `contact/index.html`

That is it.

No email alerts.
No Edge Functions.
No Resend.

## Seeing orders, contacts, and uploaded prescriptions

- Orders: Supabase -> Table Editor -> `orders`
- Contact form messages: Supabase -> Table Editor -> `contacts`
- Prescription files/photos: Supabase -> Storage -> `prescriptions`

In an order row, check the `files` column. It shows:

`original-file-name -> storage-file-path`

Then open Storage -> `prescriptions`, search/open that storage path, and download the file. The bucket is private on purpose so buyer prescriptions are not public.
