insert into public.subscriptions (user_id, plan, subscription_status)
select p.id, 'starter', 'trial'
from public.profiles p
where not exists (
  select 1 from public.subscriptions s where s.user_id = p.id
);