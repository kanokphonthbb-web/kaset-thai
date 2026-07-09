// Export Phase 1 draft briefs that still need content → scratchpad/briefs/phase1.json
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createClient } from "@libsql/client";
const t=readFileSync(new URL("../.env.vercel",import.meta.url),"utf8");const env={};for(const l of t.split("\n")){const m=l.match(/^([A-Z_]+)=(.*)$/);if(m)env[m[1]]=m[2].replace(/^"|"$/g,"")}
const db=createClient({url:env.TURSO_DATABASE_URL,authToken:env.TURSO_AUTH_TOKEN});
const phase=process.argv[2]||"Phase 1";
const rows=(await db.execute({sql:`SELECT a.slug,a.title,a.focusKeyword,a.articleType,a.subcategory,a.brief,c.slug catSlug,c.name catName
  FROM Article a LEFT JOIN ArticleCategory c ON a.categoryId=c.id
  WHERE a.phase=? AND a.status='draft' AND length(a.content)<50 AND length(a.rawHtml)<50
  ORDER BY a.priority, a.subcategory, a.slug`,args:[phase]})).rows;
const out=rows.map(r=>{let b={};try{b=JSON.parse(r.brief||"{}")}catch{}; return {
  slug:r.slug,title:r.title,keyword:r.focusKeyword,articleType:r.articleType,
  category:r.catName,catSlug:r.catSlug,subcategory:r.subcategory,
  cluster:b.cluster,intent:b.intent,audience:b.audience,type:b.type,angle:b.angle,
  mustInclude:b.mustInclude,sources:b.sources,internalLinks:b.internalLinks,instruction:b.instruction};});
const dir=new URL("../scratchpad-briefs/",import.meta.url);mkdirSync(dir,{recursive:true});
writeFileSync(new URL("phase1.json",dir),JSON.stringify(out,null,2));
console.log("exported",out.length,"briefs to scratchpad-briefs/phase1.json");
console.log("by category:");const c={};for(const x of out)c[x.category]=(c[x.category]||0)+1;console.log(c);
console.log("by articleType:");const at={};for(const x of out)at[x.articleType]=(at[x.articleType]||0)+1;console.log(at);
