-- Supabase no longer guarantees implicit Data API grants for newly-created
-- tables/functions. Make the server-only admin client's access explicit so the
-- Sections tab works regardless of the project's default-privilege setting.
grant select, insert, update, delete on table public.sections to service_role;

-- The section RPCs are SECURITY INVOKER and fan out into products, so their
-- caller also needs the product privileges used by the function body. These
-- grants are already required by the product admin routes; spelling them out
-- makes the migration self-contained under the newer Supabase defaults.
grant select, insert, update, delete on table public.products to service_role;

-- PostgreSQL grants EXECUTE on new functions to PUBLIC. Revoking only from
-- anon/authenticated leaves that inherited PUBLIC grant in place, so the
-- original migration did not actually make these admin-only RPCs private.
revoke execute on function public.admin_delete_section(text)
  from public, anon, authenticated;
revoke execute on function public.admin_rename_section_slug(text, text)
  from public, anon, authenticated;

grant execute on function public.admin_delete_section(text) to service_role;
grant execute on function public.admin_rename_section_slug(text, text) to service_role;
