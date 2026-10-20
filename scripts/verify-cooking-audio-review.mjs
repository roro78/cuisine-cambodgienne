/**
 * Contrat pur de cohérence des revues humaines des NOUVEAUX guides MP3.
 * Aucun enregistrement, aucun accès réseau ; les vieux MP3 sont hors champ.
 * Une CI ne remplace jamais une écoute humaine.
 */
const FIELDS = [
  ['acousticListening','audioListeningValidated'],
  ['mobile','mobileValidated'],
  ['desktop','desktopValidated']
];
export function verifyCookingAudioReview(blueprint, manifest) {
  const errors=[];
  const status=blueprint?.audio?.status;
  const recorded=manifest?.status;
  if (!['generated_review_pending','validated'].includes(status)) {
    errors.push('État audio de la fiche non pris en charge.');
    return errors;
  }
  if (!['audio_generated_review_pending','audio_validated'].includes(recorded))
    errors.push('État audio du manifeste non pris en charge.');
  for (const [manifestField, blueprintField] of FIELDS) {
    const m=manifest?.review?.[manifestField], b=blueprint?.review?.[blueprintField];
    if (typeof m!=='boolean' || typeof b!=='boolean')
      errors.push('La preuve de revue '+manifestField+' doit être un booléen dans les deux fichiers.');
    else if (m!==b)
      errors.push('Contradiction de revue '+manifestField+' : manifeste et fiche différents.');
  }
  const passed=FIELDS.every(([mf,bf])=>
    manifest?.review?.[mf]===true && blueprint?.review?.[bf]===true);
  if (status==='validated') {
    if (recorded!=='audio_validated')errors.push('Audio validé : le manifeste doit être audio_validated.');
    if (!passed)errors.push('Audio validé sans écoute intégrale et tests mobile/desktop réellement attestés.');
  }
  if (recorded==='audio_validated' && status!=='validated')
    errors.push('Manifeste audio validé avant validation de la fiche.');
  if (blueprint?.status==='release_ready' && !passed)
    errors.push('Publication refusée : contrôles humains audio non certifiés.');
  return errors;
}
