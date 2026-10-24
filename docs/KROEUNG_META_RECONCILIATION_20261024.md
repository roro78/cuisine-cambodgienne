# Cuisine du Cambodge — réconciliation Kroeung Meta (24 octobre 2026)

## État vérifié — ne pas refaire les audits n8n
- PR #116 à #119 fusionnées ; workflows 01/02 synchronisés, workflow 03 intact.
- Synchronisation via `--apply` exécutée une seule fois, readback identique, trois workflows **inactifs**.
- PostgreSQL / Supabase lecture seule : post `id=1`, `source_id=ingredient:kroeung`, approuvé le 21 octobre ; depuis, `status=publishing`, `fb_state=submitting`, `ig_state=creating`.
- `facebook_post_id`, `instagram_container_id`, `instagram_post_id` : NULL.
- *Ces valeurs NULL ne prouvent pas qu'aucune publication Meta n'existe.*
- Média attendu : `https://www.cuisine-du-cambodge.com/social-assets/ingredient-kroeung.jpg` ; le fichier JPEG était présent sur la branche `ovh-production`. Son accès HTTP par Meta n'a pas encore été prouvé.
- Credential existant dans n8n : `Cuisine du Cambodge - Meta.` (point final réel). Sa valeur est chiffrée, l'API n8n ne permet pas de la lire.

## Objectif du contrôle manquant

Inventorier les publications Meta existantes *avant toute réinitialisation, publication ou activation*. L'examen des posts Facebook doit couvrir **posts publiés et photos envoyées** ; Instagram doit être examiné indépendamment.

Le script `scripts/reconcile-kroeung-meta-readonly.mjs` utilise **exclusivement GET**, sur les endpoints Graph Meta v26.0 :
- Page `206899719342067` (identité et compte Instagram lié) ;
- `/published_posts` (Facebook) ;
- `/photos?type=uploaded` (Facebook) ;
- `/{ig-id}/media` (Instagram, si lié et accessible).

Toutes les pages API sont parcourues avec un plafond explicite. Les résultats complets, tronqués ou indisponibles restent distincts. Toute correspondance Kroeung exige une revue humaine de la date, du contenu et du lien.

### Authentification assistée sous PowerShell (terminal privé, pas dans le chat)

Le jeton requis est le **jeton de Page Meta**, différent de `N8N_API_KEY` et de la clé Resend.
L'IDE doit ouvrir le terminal et faire saisir le jeton par l'utilisateur **sans écho** :

```powershell
$secure = Read-Host "Jeton Meta de la Page Cuisine" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
  $env:META_PAGE_ACCESS_TOKEN = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  node scripts/reconcile-kroeung-meta-readonly.mjs
} finally {
  if ($ptr -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
  }
  Remove-Item Env:META_PAGE_ACCESS_TOKEN -ErrorAction SilentlyContinue
  Remove-Variable secure -ErrorAction SilentlyContinue
}
```

Le jeton ne doit jamais être collé dans un prompt, un fichier, GitHub ou une capture. La variable est temporaire et nettoyée dans `finally`. Ne pas enregistrer le contenu de la session PowerShell.

### Interprétation des résultats

- `POSSIBLE_DUPLICATE_REVIEW` : au moins une publication/photo correspond ; ouvrir le lien et comparer avec le brouillon. **Ne pas republier.**
- `NO_KEYWORD_CANDIDATE_IN_SCANNED_EDGES` : aucune correspondance textuelle dans ces vues. **Ce n'est pas une preuve générale d'absence** (publications archivées, autres modes de publication, permissions et omissions restent possibles).
- `BLOCKED*` : Page incorrecte, token rejeté, pagination tronquée, accès Instagram indisponible ou erreur ; résoudre l'accès en lecture seule, sans automatiser une publication.

**Aucune écriture PostgreSQL n'est autorisée dans ce chantier. Aucune relance de 02/03, aucun clic Publish et aucune action POST Meta.** Les premiers essais réels nécessitent une autorisation explicite distincte.

### Critères de clôture de cette étape
- Retour du rapport GET avec inventaires Facebook/Photos/Instagram complets ou réserves documentées ;
- liens ou identifiants de toute correspondance Kroeung ;
- verdict par plateforme **CANDIDAT / NON DÉMONTRÉ / BLOQUÉ**, sans déduction automatique d'absence ;
- plan de réconciliation proposé **sans exécution**.
