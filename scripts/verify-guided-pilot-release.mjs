/**
 * NO-GO vérifiable du pilote tamarin tant qu'il n'est pas migré vers PR #90.
 * Aucune génération audio, aucune modification des enregistrements existants.
 */
const PHASE_IDS=['installer','preparer','assembler','maitriser','rectifier','terminer'];
const REVIEW_FIELDS=['recipeTested','photoRightsValidated','acousticListeningValidated','mobileValidated','desktopValidated','editorialApproved','productionApproved'];
export function guidedPilotReleaseBlockers(workshop,manifest,canonicalRecipeExists){
  const problems=[];
  if(canonicalRecipeExists!==true)problems.push('La sauce tamarin doit figurer au catalogue canonique des recettes avant homologation.');
  if(workshop?.steps?.length!==6 || workshop.steps.some((s,i)=>s.id!==PHASE_IDS[i]))
    problems.push('Les six phases du pilote ne respectent pas les IDs invariants PR #90.');
  if(manifest?.chapters?.length!==7 || manifest.chapters.some((c,i)=>c.id!==(i===0?'intro':PHASE_IDS[i-1])))
    problems.push('Le MP3 existant n’est pas aligné sur le nouvel ordre de chapitres standard.');
  if(workshop?.release?.photoUrl?.startsWith('/')!==true || workshop?.release?.photoRightsValidated!==true)
    problems.push('Photographie finale vérifiée et droits documentés absents.');
  for(const field of REVIEW_FIELDS){
    if(workshop?.release?.[field]!==true)problems.push('Gate humain non attesté : '+field);
  }
  if(manifest?.review?.acousticListening!==true || manifest?.review?.mobile!==true || manifest?.review?.desktop!==true)
    problems.push('Le manifeste MP3 exige l’écoute intégrale et les contrôles mobile/desktop.');
  if(manifest?.status!=='audio_validated')problems.push('Le manifeste audio doit être réellement validé.');
  return problems;
}
