(() => {
  const $ = id => document.getElementById(id);
  const files = $('asset-photos');
  const preview = $('file-preview');
  const drop = $('dropzone');
  const form = $('upload-form');
  if (!files || !form) return;
  const name = () => {
    const kind = $('asset-kind').value;
    const slug = $('asset-slug').value.toLowerCase().trim() || 'identifiant-page';
    const section = $('asset-section').value;
    const step = String(Math.max(1, Number($('asset-step').value || '1'))).padStart(2,'0');
    const version = String(Math.max(1,Number($('asset-version').value || '1'))).padStart(2,'0');
    const ext = files.files?.[0]?.name?.split('.').pop().toLowerCase() || 'webp';
    $('name-preview').textContent = `${kind}__${slug}__${section === 'etape' ? 'etape-' + step : section}__v${version}.${ext === 'jpeg' ? 'jpg' : ext}`;
  };
  for (const id of ['asset-kind','asset-slug','asset-section','asset-step','asset-version']) $(id).addEventListener('input', name);
  files.addEventListener('change', () => {
    preview.replaceChildren();
    const selection = Array.from(files.files || []);
    selection.forEach((file, i) => {
      const chip = document.createElement('div'); chip.className = 'file-chip';
      const img = document.createElement('img'); img.alt = ''; const url = URL.createObjectURL(file); img.src = url; img.onload = () => URL.revokeObjectURL(url);
      const description = document.createElement('span'); description.textContent = `${i + 1}. ${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} Mo`;
      chip.append(img,description); preview.append(chip);
    });
    if (selection.length > 10) { const message = document.createElement('p'); message.className = 'notice error'; message.textContent = 'Maximum dix fichiers par envoi.'; preview.append(message); }
    name();
  });
  for (const event of ['dragenter','dragover']) drop.addEventListener(event, e => { e.preventDefault(); drop.classList.add('dragover'); });
  for (const event of ['dragleave','drop']) drop.addEventListener(event, e => { e.preventDefault(); drop.classList.remove('dragover'); });
  drop.addEventListener('drop', e => { if (e.dataTransfer?.files?.length) { files.files = e.dataTransfer.files; files.dispatchEvent(new Event('change')); } });
  form.addEventListener('submit', e => {
    if (!files.files?.length || files.files.length > 10 || Array.from(files.files).some(x => x.size > 8 * 1024 * 1024)) { e.preventDefault(); alert('Sélectionnez entre une et dix photos de 8 Mo maximum chacune.'); return; }
    $('submit-upload').disabled = true; $('submit-upload').textContent = 'Envoi en cours…';
  });
  name();
})();