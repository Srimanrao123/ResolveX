-- Run once after schema.sql. Creates a realistic demo store, seller queue, and customer orders.
create extension if not exists "uuid-ossp";

insert into public.stores (id, name, return_window_days, auto_approval_limit)
values (uuid_generate_v5(uuid_ns_url(), 'returnguard-thread-hue'), 'Thread & Hue', 30, 5000)
on conflict (id) do nothing;

insert into public.products (id, store_id, name, category, price, is_final_sale)
values
  (uuid_generate_v5(uuid_ns_url(), 'returnguard-product-tee'), uuid_generate_v5(uuid_ns_url(), 'returnguard-thread-hue'), 'Oversized Cotton T-Shirt', 'T-Shirts', 1499, false),
  (uuid_generate_v5(uuid_ns_url(), 'returnguard-product-shoes'), uuid_generate_v5(uuid_ns_url(), 'returnguard-thread-hue'), 'Premium Running Shoes', 'Shoes', 4999, false),
  (uuid_generate_v5(uuid_ns_url(), 'returnguard-product-jacket'), uuid_generate_v5(uuid_ns_url(), 'returnguard-thread-hue'), 'Classic Denim Jacket', 'Jackets', 3299, false)
on conflict (id) do nothing;

insert into public.profiles (id, email, full_name, role) values
  (uuid_generate_v5(uuid_ns_url(), 'returnguard-demo-priya'), 'priya.demo@threadhue.test', 'Priya Nair', 'customer'),
  (uuid_generate_v5(uuid_ns_url(), 'returnguard-demo-rahul'), 'rahul.demo@threadhue.test', 'Rahul Sharma', 'customer')
on conflict (email) do nothing;

insert into public.orders (id, display_id, store_id, customer_id, status, delivered_at) values
  (uuid_generate_v5(uuid_ns_url(), 'returnguard-order-priya-tee'), 'TH10284', uuid_generate_v5(uuid_ns_url(), 'returnguard-thread-hue'), uuid_generate_v5(uuid_ns_url(), 'returnguard-demo-priya'), 'DELIVERED', now() - interval '8 days'),
  (uuid_generate_v5(uuid_ns_url(), 'returnguard-order-rahul-shoes'), 'TH10293', uuid_generate_v5(uuid_ns_url(), 'returnguard-thread-hue'), uuid_generate_v5(uuid_ns_url(), 'returnguard-demo-rahul'), 'DELIVERED', now() - interval '10 days'),
  (uuid_generate_v5(uuid_ns_url(), 'returnguard-order-rahul-jacket'), 'TH10071', uuid_generate_v5(uuid_ns_url(), 'returnguard-thread-hue'), uuid_generate_v5(uuid_ns_url(), 'returnguard-demo-rahul'), 'DELIVERED', now() - interval '43 days')
on conflict (display_id) do nothing;

insert into public.order_items (id, order_id, product_id, quantity, unit_price) values
  (uuid_generate_v5(uuid_ns_url(), 'returnguard-item-priya-tee'), uuid_generate_v5(uuid_ns_url(), 'returnguard-order-priya-tee'), uuid_generate_v5(uuid_ns_url(), 'returnguard-product-tee'), 1, 1499),
  (uuid_generate_v5(uuid_ns_url(), 'returnguard-item-rahul-shoes'), uuid_generate_v5(uuid_ns_url(), 'returnguard-order-rahul-shoes'), uuid_generate_v5(uuid_ns_url(), 'returnguard-product-shoes'), 1, 4999),
  (uuid_generate_v5(uuid_ns_url(), 'returnguard-item-rahul-jacket'), uuid_generate_v5(uuid_ns_url(), 'returnguard-order-rahul-jacket'), uuid_generate_v5(uuid_ns_url(), 'returnguard-product-jacket'), 1, 3299)
on conflict (id) do nothing;

insert into public.return_cases (id, display_id, order_item_id, customer_id, requested_resolution, customer_message, reason, outcome, status, risk_level, policy_result, ai_summary, evidence_assessment) values
  (uuid_generate_v5(uuid_ns_url(), 'returnguard-case-priya'), 'RET-2049', uuid_generate_v5(uuid_ns_url(), 'returnguard-item-priya-tee'), uuid_generate_v5(uuid_ns_url(), 'returnguard-demo-priya'), 'refund', 'The shirt is too tight.', 'TOO_SMALL', 'APPROVED', 'APPROVED', 'LOW', 'Eligible', 'Order is within the return window and the customer has a normal return history. Automatic approval is recommended.', 'No evidence required for size-related return.'),
  (uuid_generate_v5(uuid_ns_url(), 'returnguard-case-rahul'), 'RET-2048', uuid_generate_v5(uuid_ns_url(), 'returnguard-item-rahul-shoes'), uuid_generate_v5(uuid_ns_url(), 'returnguard-demo-rahul'), 'refund', 'The shoes arrived damaged. I would like a refund.', 'DAMAGED', 'SELLER_REVIEW', 'UNDER_REVIEW', 'HIGH', 'Eligible', 'Manual review recommended because the customer has repeated damage claims and the available evidence is inconclusive.', 'The uploaded image does not clearly show the claimed damage.')
on conflict (display_id) do nothing;

create or replace function public.verify_returnguard_otp(p_email text, p_code_hash text, p_session_hash text, p_seller_email text)
returns table(profile_id uuid, role public.user_role)
language plpgsql security definer set search_path = public as $$
declare current_otp public.email_otps; verified_profile public.profiles; demo_store uuid := uuid_generate_v5(uuid_ns_url(), 'returnguard-thread-hue'); demo_product uuid := uuid_generate_v5(uuid_ns_url(), 'returnguard-product-tee'); demo_order uuid;
begin
  select * into current_otp from public.email_otps where email = lower(trim(p_email)) for update;
  if current_otp is null or current_otp.expires_at < now() or current_otp.attempts >= 5 or current_otp.code_hash <> p_code_hash then
    update public.email_otps set attempts = attempts + 1 where email = lower(trim(p_email));
    raise exception 'Invalid or expired verification code.';
  end if;
  insert into public.profiles (email, role) values (lower(trim(p_email)), case when lower(trim(p_email)) = lower(trim(p_seller_email)) then 'seller'::public.user_role else 'customer'::public.user_role end)
  on conflict (email) do update set role = case when excluded.email = lower(trim(p_seller_email)) then 'seller'::public.user_role else public.profiles.role end returning * into verified_profile;
  if verified_profile.role = 'seller' then
    insert into public.store_members (store_id, profile_id, role) values (demo_store, verified_profile.id, 'seller') on conflict do nothing;
  elsif not exists (select 1 from public.orders where customer_id = verified_profile.id) then
    demo_order := uuid_generate_v4();
    insert into public.orders (id, display_id, store_id, customer_id, status, delivered_at) values (demo_order, 'TH-' || upper(substring(replace(verified_profile.id::text, '-', '') from 1 for 6)), demo_store, verified_profile.id, 'DELIVERED', now() - interval '9 days');
    insert into public.order_items (order_id, product_id, quantity, unit_price) values (demo_order, demo_product, 1, 1499);
  end if;
  delete from public.email_otps where email = lower(trim(p_email));
  insert into public.app_sessions (token_hash, profile_id, expires_at) values (p_session_hash, verified_profile.id, now() + interval '7 days');
  return query select verified_profile.id, verified_profile.role;
end;
$$;
