import { parseArgs } from 'node:util';

import fs from 'fs';
import path from 'path';

function redact(text, activateRedact) {
   let redactedLine = '';
   let redactIsActive = false;
    
   for (let letter of text) {
     switch (letter) {
       case '«' : redactIsActive = true; break;
       case '»' : redactIsActive = false; break;
       default : {
         redactedLine+=activateRedact && redactIsActive ? '█' : letter;
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

function process(srcDir, dstDir,activateRedact) {
  for (const file of getAllFiles(srcDir)) {
    if (file.endsWith('.md') === false) continue;

    console.log(`Processing ${file}.`)
  
    const srcDir = path.dirname(file);
    const fname = path.basename(file);
    const dstdir = `${dstDir}/${srcDir}`;
    const content = fs.readFileSync(file, 'utf-8');
  
    console.log(`Processing ${file}.`);
    const redactedContent = redact(content, activateRedact);
    
    
    console.log(`Writing ${dstdir}/${fname}.`)
    fs.mkdirSync(dstdir, { recursive : true});
    fs.writeFileSync(`${dstdir}/${fname}`, redactedContent);
  }  
}

const args = parseArgs({
  options: {
      srcDir: { type: 'string', short: 's', default : '.'},
      dstDir: { type: 'string', short: 'd', default : '/tmp' },
      'no-redact': { type: 'boolean', short: 'n', default : false}
  }
}).values;

process(path.resolve(args.srcDir), args.dstDir, args['no-redact']);