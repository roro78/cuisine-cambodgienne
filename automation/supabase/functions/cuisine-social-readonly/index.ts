// Private read-only bridge: OVH Studio -> Supabase Edge -> SELECT-only Postgres role.
// Do not deploy until both function secrets are provisioned and the contract is tested.
import postgres from "npm:postgres@3.4.5";

const ALLOWED = new Set(["all","draft","approved","revision_requested","rejected","publishing","published","manual_review","sources"]);
const DB_HOST = "aws-1-eu-west-3.pooler.supabase.com";
const DB_USER = "cuisine_social_viewer.kljbnfjxwloiodwlbrrz";
const FIELDS = "id::text AS id,source_id,source_fingerprint,source_snapshot,scheduled_date::text AS scheduled_date,facebook_caption,instagram_caption,image_url,status,fb_state,ig_state,human_decision,human_note,decided_at::text AS decided_at,approved_at::text AS approved_at,published_at::text AS published_at,facebook_post_id,instagram_post_id,instagram_container_id";

function reply(code, data) {
  return new Response(JSON.stringify(data), {status:code, headers:{
    "content-type":"application/json; charset=utf-8",
    "cache-control":"private, no-store, max-age=0",
    "x-content-type-options":"nosniff"
  }});
}
async function authorized(provided, secret) {
  if (typeof provided!=="string" || typeof secret!=="string" ||
      !/^[A-Za-z0-9_-]{32,256}$/.test(secret) ||
      !/^[A-Za-z0-9_-]{32,256}$/.test(provided)) return false;
  const e=new TextEncoder();
  const [x,y]=await Promise.all([
    crypto.subtle.digest("SHA-256",e.encode(provided)),
    crypto.subtle.digest("SHA-256",e.encode(secret))
  ]);
  const a=new Uint8Array(x),b=new Uint8Array(y);
  let diff=0;
  for(let i=0;i<a.length;i++) diff|=a[i]^b[i];
  return diff===0;
}
function databaseUrl(value) {
  try {
    const u=new URL(value);
    if (!["postgres:","postgresql:"].includes(u.protocol) ||
        u.hostname!==DB_HOST || u.port!=="5432" || u.pathname!=="/postgres" ||
        u.search!=="" || u.hash!=="" ||
        decodeURIComponent(u.username)!==DB_USER || !u.password) return null;
    return value;
  } catch {return null;}
}
function parameters(req) {
  const url=new URL(req.url);
  const keys=[...url.searchParams.keys()];
  if(new Set(keys).size!==keys.length ||
     keys.some(x=>!["status","page","draft_id"].includes(x))) return null;
  const status=url.searchParams.get("status")??"draft";
  const pageText=url.searchParams.get("page")??"1";
  const draftId=url.searchParams.get("draft_id");
  if(!ALLOWED.has(status) || !/^[1-9][0-9]{0,5}$/.test(pageText))return null;
  const page=Number(pageText);
  if(page>100000 || (draftId!==null &&
     (!/^[1-9][0-9]{0,18}$/.test(draftId) ||
      (draftId.length===19 && draftId>"9223372036854775807"))))return null;
  return {status,offset:(page-1)*50,draftId};
}
Deno.serve(async(req)=>{
  if(req.method!=="GET")return reply(405,{error:"method_not_allowed"});
  if(!await authorized(req.headers.get("x-cdc-social-read-token"),
                       Deno.env.get("CDC_SOCIAL_REVIEW_TOKEN")))
    return reply(401,{error:"unauthorized"});
  const args=parameters(req);
  if(!args)return reply(400,{error:"invalid_parameters"});
  const connection=databaseUrl(Deno.env.get("CDC_SOCIAL_READONLY_PG_URL"));
  if(!connection)return reply(503,{error:"unavailable"});
  const db=postgres(connection,{max:1,prepare:false,connect_timeout:5,idle_timeout:1,
    ssl:{rejectUnauthorized:true}});
  try{
    const result=await db.begin(async(tx)=>{
      await tx`SET TRANSACTION READ ONLY`;
      const role=await tx`
        SELECT r.rolname='cuisine_social_viewer' AS correct_user,
               r.rolcanlogin AND NOT r.rolinherit AND NOT r.rolsuper
               AND NOT r.rolbypassrls AND NOT r.rolcreatedb AND NOT r.rolcreaterole
               AND NOT r.rolreplication AS safe_role,
               has_schema_privilege(current_user,'cuisine_social','USAGE') AS schema_usage,
               has_table_privilege(current_user,'cuisine_social.posts','SELECT') AS can_read,
               NOT (has_table_privilege(current_user,'cuisine_social.posts','INSERT')
                  OR has_table_privilege(current_user,'cuisine_social.posts','UPDATE')
                  OR has_table_privilege(current_user,'cuisine_social.posts','DELETE')
                  OR has_table_privilege(current_user,'cuisine_social.posts','TRUNCATE')
                  OR has_table_privilege(current_user,'cuisine_social.posts','REFERENCES')
                  OR has_table_privilege(current_user,'cuisine_social.posts','TRIGGER')
                  OR has_table_privilege(current_user,'cuisine_social.validation_dispatches','SELECT')
                  OR has_table_privilege(current_user,'cuisine_social.validation_dispatches','INSERT')
                  OR has_table_privilege(current_user,'cuisine_social.validation_dispatches','UPDATE')
                  OR has_table_privilege(current_user,'cuisine_social.validation_dispatches','DELETE')
               ) AS no_other_rights,
               (SELECT c.relrowsecurity FROM pg_class c JOIN pg_namespace n
                ON n.oid=c.relnamespace WHERE n.nspname='cuisine_social'
                AND c.relname='posts') AS rls_enabled,
               EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='cuisine_social'
                 AND tablename='posts' AND policyname='cuisine_social_viewer_read_posts'
                 AND cmd='SELECT' AND qual='true' AND with_check IS NULL
                 AND roles=ARRAY['cuisine_social_viewer']::name[]) AS viewer_policy,
               NOT EXISTS(SELECT 1 FROM pg_auth_members m
                 LEFT JOIN pg_roles member_role ON member_role.oid=m.member
                 WHERE m.member=r.oid OR (m.roleid=r.oid AND NOT
                  (member_role.rolname='postgres' AND m.admin_option=true
                   AND m.inherit_option=false AND m.set_option=false))) AS safe_memberships
          FROM pg_roles r WHERE r.rolname=current_user
      `;
      if(!role[0] || Object.values(role[0]).some(v=>v!==true))
        throw new Error("readonly_identity_failure");
      const counter=await tx`SELECT status,count(*)::int AS total
                             FROM cuisine_social.posts GROUP BY status`;
      const counts=Object.fromEntries(counter.map(x=>[x.status,x.total]));
      let rows=[];
      if(args.status!=="sources"){
        const base="SELECT "+FIELDS+" FROM cuisine_social.posts";
        // SQL fragments below are static, all request values are bound parameters.
        rows=args.status==="all"
          ? await tx.unsafe(base+" ORDER BY scheduled_date DESC,id DESC LIMIT 50 OFFSET $1",
                            [args.offset])
          : await tx.unsafe(base+" WHERE status=$1 ORDER BY scheduled_date DESC,id DESC LIMIT 50 OFFSET $2",
                            [args.status,args.offset]);
      }
      let target=null;
      if(args.draftId!==null){
        const found=await tx`SELECT id::text AS id,source_id,source_fingerprint,
          scheduled_date::text AS scheduled_date,facebook_caption,instagram_caption,
          image_url,status,fb_state,ig_state,human_decision,decided_at,
          approved_at,published_at,facebook_post_id,instagram_post_id,
          instagram_container_id FROM cuisine_social.posts
          WHERE id::text=${args.draftId} AND status='draft' AND human_decision IS NULL LIMIT 1`;
        target=found[0]??null;
      }
      let history=[],history_overflow=false;
      if(args.status==="sources"){
        history=await tx`SELECT DISTINCT ON(source_id) source_id,source_fingerprint,status
          FROM cuisine_social.posts ORDER BY source_id,scheduled_date DESC,id DESC LIMIT 1001`;
        history_overflow=history.length>1000;
        if(history_overflow)history=[];
      }
      return {rows,counts,target,history,history_overflow};
    });
    if(JSON.stringify(result).length>1500000)return reply(503,{error:"oversized_result"});
    return reply(200,result);
  }catch(_error){
    // Do not leak role, SQL, connection details, or private rows.
    return reply(503,{error:"unavailable"});
  }finally{
    await db.end({timeout:1}).catch(()=>{});
  }
});
