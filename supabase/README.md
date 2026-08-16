# Supabase Setup

Tiny version:

1. Create a new Supabase project, or open the existing Provocateur project.
2. Go to `SQL Editor`.
3. Paste/run `supabase/schema.sql`.
4. Go to `Project Settings -> API`.
5. Copy your project URL and publishable key.
6. Replace the old values in:
   - `product/index.html`
   - `contact/index.html`

That is it.

The SQL file is idempotent: it is safe to run for a fresh setup or paste again
into the existing project after a website update. It preserves existing order
and contact rows while adding any new columns with `if not exists`.

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

If an order has no file path in `orders.files`, the buyer did not have an uploaded prescription attached to the cart item at checkout. On the site, open the cart before checkout and confirm it says `Prescription attached: filename`.

Each new order also stores:

- `product_key`: the stable website identifier, such as `rayban`, `meta-adventurer`, `meta-fury`, `oakley-hstn`, or `kylie`
- `product`: the readable replacement-lens product name
- `model`: the selected frame/model name
- `vision`: `Single Vision`, `Progressive`, or `Non-Prescription`

Product and option columns are intentionally text fields rather than database
enums, so future frame families and lens choices will not require another SQL
schema change.
