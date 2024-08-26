import fs from 'fs';
import path from 'path';

function redact(text) {
   let redactedLine = '';
   let redactIsActive = false;
    
   for (let letter of text) {
     switch (letter) {
       case '«' : redactIsActive = true; break;
       case '»' : redactIsActive = false; break;
       default : {
         redactedLine+=redactIsActive ? '█' : letter;
       }
     }
   }

   return redactedLine;
}

function* getAllFiles(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    if (file.isDirectory()) {
      yield* getAllFiles(path.join(dir, file.name));
    } else {
      yield path.join(dir, file.name);
    }
  }
}

for (const file of getAllFiles('.')) {
  if (file.endsWith('.md') === false) continue;

  const srcdir = path.dirname(file);
  const fname = path.basename(file);
  const dstdir = `/tmp/x/${srcdir}`;
  const content = fs.readFileSync(file, 'utf-8');

  console.log(`Processing ${file}.`);
  const redactedContent = redact(content);
  
  
  fs.mkdirSync(dstdir, { recursive : true});
  fs.writeFileSync(`${dstdir}/${fname}`, redactedContent);
}

