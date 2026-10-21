// Offline output only. No hosting, social or audio API calls.
import { readFileSync,writeFileSync } from 'node:fs';
import { expectedWorkshopHtaccess,workshopCutoverApproved } from './workshop-cutover-seo.mjs';
writeFileSync('dist/.htaccess',expectedWorkshopHtaccess(readFileSync('public/.htaccess','utf8')));
console.log(workshopCutoverApproved()?'Six workshop 301 redirects staged':'No workshop 301 redirects before release');
