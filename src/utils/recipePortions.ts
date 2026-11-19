import type {Recipe} from '../data/recipes';

export type PortionValue =
  | {kind:'ingredient'; ingredient:string}
  | {kind:'reserve'; ingredient:string; fraction:number}
  | {kind:'containers'; perServing:number};
export interface PortionBinding { literal:string; value:PortionValue; prefix?:string; suffix?:string }
export interface RecipePortionBindings {
  steps:Record<number,PortionBinding[]>;
  equipment:Record<number,PortionBinding[]>;
}
// Only presentation bindings live here. Amounts, units and scaling policy come
// from the ONE canonical recipe. No global replacement of arbitrary numbers.
export const portionBindings:Record<string,RecipePortionBindings>={
  'amok-trey':{
    steps:{
      0:[{literal:'1 c. à soupe',value:{kind:'reserve',ingredient:'lait de coco',fraction:15/250}},
         {literal:'250 ml',value:{kind:'ingredient',ingredient:'lait de coco'}},
         {literal:'3 c. à soupe',value:{kind:'ingredient',ingredient:'kroeung jaune'}}],
      3:[{literal:'quatre ramequins',value:{kind:'containers',perServing:1}}],
      4:[{literal:'la cuillerée de lait de coco réservée',value:{kind:'reserve',ingredient:'lait de coco',fraction:15/250},prefix:'la réserve de lait de coco (',suffix:')'}]
    },
    equipment:{1:[{literal:'4 ramequins',value:{kind:'containers',perServing:1}}]}
  }
};
export function scaledQuantity(amount:number,base:number,servings:number,scalable=true):number {
  if(!Number.isFinite(amount)||amount<0||!Number.isFinite(base)||base<=0
    ||!Number.isInteger(servings)||servings<1||servings>12)throw Error('PORTION_INPUT');
  return scalable?amount*servings/base:amount;
}
export function formatQuantity(value:number,unit=''):string {
  if(!Number.isFinite(value))throw Error('PORTION_QUANTITY');
  // Keep half-millilitres in the total; never round away a half egg.
  if(unit==='ml'||unit==='g')return value.toLocaleString('fr-FR',{maximumFractionDigits:1});
  const whole=Math.floor(value),part=value-whole;
  const fractions:Array<[number,string]>=[[.125,'⅛'],[.25,'¼'],[1/3,'⅓'],[.5,'½'],[2/3,'⅔'],[.75,'¾'],[.875,'⅞']];
  const fraction=fractions.find(([n])=>Math.abs(n-part)<.012)?.[1];
  return fraction?(whole?whole+' '+fraction:fraction):value.toLocaleString('fr-FR',{maximumFractionDigits:2});
}
export function resolvePortionValue(recipe:Recipe,value:PortionValue){
  if(value.kind==='containers'){
    if(!Number.isFinite(value.perServing)||value.perServing<=0)throw Error('PORTION_CONTAINERS');
    return {amount:recipe.baseServings*value.perServing,unit:'ramequins',scalable:true,approximate:false};
  }
  const matches=recipe.ingredients.filter(i=>i.name===value.ingredient);
  if(matches.length!==1||matches[0].quantity===undefined)throw Error('PORTION_SOURCE_INGREDIENT');
  const i=matches[0];
  if(value.kind==='reserve'&&(!(value.fraction>0&&value.fraction<1)||i.unit!=='ml'))throw Error('PORTION_RESERVE');
  return {amount:i.quantity!*(value.kind==='reserve'?value.fraction:1),unit:i.unit??'',
    scalable:i.scalable!==false,approximate:value.kind==='reserve'};
}
export function portionLabel(amount:number,unit:string,approximate=false):string {
  if(unit==='ramequins')return amount+' ramequin'+(amount>1?'s':'');
  // A 3.75 ml reserve is a practical "environ 4 ml", not a new exact dose.
  const display=approximate&&amount<5?Math.round(amount):amount;
  return (display!==amount?'environ ':'')+formatQuantity(display,unit)+(unit?' '+unit:'');
}
export function portionSegments(recipe:Recipe,text:string,bindings:PortionBinding[]=[]){
  const slots=bindings.map(binding=>{
    const start=text.indexOf(binding.literal);
    if(start<0||text.indexOf(binding.literal,start+binding.literal.length)!==-1)throw Error('PORTION_BINDING_STALE '+recipe.slug);
    return {start,end:start+binding.literal.length,binding,...resolvePortionValue(recipe,binding.value)};
  }).sort((a,b)=>a.start-b.start);
  let cursor=0;const parts:Array<{text:string;slot?:typeof slots[number]}>=[];
  for(const slot of slots){
    if(slot.start<cursor)throw Error('PORTION_BINDING_OVERLAP');
    if(slot.start>cursor)parts.push({text:text.slice(cursor,slot.start)});
    parts.push({text:(slot.binding.prefix??'')+portionLabel(slot.amount,slot.unit,slot.approximate)+(slot.binding.suffix??''),slot});
    cursor=slot.end;
  }
  if(cursor<text.length)parts.push({text:text.slice(cursor)});
  return parts;
}
export function renderPortionText(recipe:Recipe,text:string,bindings:PortionBinding[],servings:number){
  return portionSegments(recipe,text,bindings).map(p=>p.slot
    ?(p.slot.binding.prefix??'')+portionLabel(scaledQuantity(p.slot.amount,recipe.baseServings,servings,p.slot.scalable),p.slot.unit,p.slot.approximate)+(p.slot.binding.suffix??''):p.text).join('');
}
export function updatePortionSlots(scope:ParentNode,servings:number):void {
  scope.querySelectorAll<HTMLElement>('[data-portion-slot]').forEach(el=>{
    const amount=scaledQuantity(Number(el.dataset.portionAmount),Number(el.dataset.portionBase),servings,el.dataset.portionScalable!=='false');
    el.textContent=(el.dataset.portionPrefix??'')+portionLabel(amount,el.dataset.portionUnit??'',el.dataset.portionApproximate==='true')+(el.dataset.portionSuffix??'');
  });
}
/** Public read-only projection; never an editable recipe or private source. */
export function portionContract(recipe:Recipe,fingerprint:string){
  const rules=portionBindings[recipe.slug];
  if(!rules)return undefined;
  return {version:1,sourceFingerprint:fingerprint,steps:Object.entries(rules.steps).map(([key,bindings])=>{
    const index=Number(key),sourceText=recipe.steps[index].text;
    portionSegments(recipe,sourceText,bindings); // fail the build on stale anchors
    return {index,sourceText,anchors:bindings.map(b=>b.literal)};
  })};
}
