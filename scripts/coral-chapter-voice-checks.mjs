/** Blocking voice checks mirrored from cmsCoralCandidate. No editorial visa. */
export function coralChapterVoiceProblems(text, minLength = 400) {
  if (typeof text !== 'string') return ['length'];
  const problems = [];
  const length = [...text].length;
  if (length < minLength || length > 7000) problems.push('length');
  if (/(?<!\p{L})(?:fabriqu\p{L}*|fabrication\p{L}*|constru\p{L}*|chantier\p{L}*|maçonnerie|bétonnage|poste)(?!\p{L})/iu.test(text)
    || /\b(?:monter|montez|montage|assembler|assemblez)\s+(?:les|des|du|d.un)\s+bols?\b/iu.test(text))
    problems.push('forbidden-culinary-lexicon');
  if (/(?<![\p{L}\p{N}])\d+(?:[.,]\d+)?\s*(?:kg|g|grammes?|ml|cl|litres?|tomates?|oignons?|oeufs?|œufs?|portions?)\b/iu.test(text))
    problems.push('fixed-quantities-or-portions');
  if (/(?:^|\n)\s*(?:[-*]|\d+[.)])\s/u.test(text)) problems.push('list-instead-of-voice');
  if (/(?:je vous vois|je vous entends|je sais que vous avez fini)/iu.test(text)) problems.push('simulated-live-interaction');
  return problems;
}
