/** Read-only cgroup v2 / process measurements. No cache reset or host mutation. */
import {readFile,readdir} from 'node:fs/promises';
const kv=s=>Object.fromEntries(s.trim().split('\n').map(l=>l.trim().split(/\s+/)).map(([k,v])=>[k,Number(v)]));
export async function memorySnapshot(){try{
 const [stat,events,pressure,current,peak]=await Promise.all(['memory.stat','memory.events','memory.pressure','memory.current','memory.peak'].map(n=>readFile('/sys/fs/cgroup/'+n,'utf8')));
 const processes=[];
 for(const pid of (await readdir('/proc')).filter(n=>/^\d+$/.test(n))){try{
  const s=await readFile('/proc/'+pid+'/status','utf8'),name=s.match(/^Name:\s*(.*)$/m)?.[1];if(!['node','ffmpeg','ffprobe'].includes(name))continue;
  const get=k=>Number(s.match(new RegExp('^'+k+':\\s+(\\d+)','m'))?.[1]||0)*1024;
  processes.push({pid:Number(pid),name,rss:get('VmRSS'),anon:get('RssAnon'),file:get('RssFile')});
 }catch{}}
 return {stat:kv(stat),events:kv(events),pressure,current:Number(current),peak:Number(peak),processes};
}catch{return null;}}
export async function monitorMemory(){
 const first=await memorySnapshot(),samples=[];let busy=false;
 const sample=async()=>{if(busy)return;busy=true;try{const s=await memorySnapshot();if(s)samples.push(s);}finally{busy=false;}};
 const timer=setInterval(sample,100);timer.unref();
 return async()=>{clearInterval(timer);await sample();const last=await memorySnapshot();
  return {first,last,sample_count:samples.length,max_anon_bytes:Math.max(0,...samples.map(s=>s.stat.anon)),
   max_file_cache_bytes:Math.max(0,...samples.map(s=>s.stat.file)),max_kernel_bytes:Math.max(0,...samples.map(s=>s.stat.kernel||0)),
   max_process_anon_bytes:Math.max(0,...samples.map(s=>s.processes.reduce((n,p)=>n+p.anon,0))),
   event_delta:first&&last?Object.fromEntries(Object.keys(last.events).map(k=>[k,last.events[k]-first.events[k]])):null,
   process_high_water:samples.flatMap(s=>s.processes).reduce((a,p)=>{if(!a[p.name]||p.rss>a[p.name].rss)a[p.name]=p;return a;},{})};
 };
}
