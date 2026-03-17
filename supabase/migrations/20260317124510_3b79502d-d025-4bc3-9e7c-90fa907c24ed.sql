
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  
  insert into public.subscriptions (user_id, plan, subscription_status)
  values (new.id, coalesce(new.raw_user_meta_data->>'plan', 'starter'), 'trial');
  
  return new;
end;
$function$;
