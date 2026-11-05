import { build } from "esbuild";
import { mkdir,copyFile,readFile,writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
const out=path.resolve("dist");
await mkdir(out,{recursive:true});
const manifest=JSON.parse(await readFile("manifest.json","utf8"));

manifest.icons={"16":"icons/icon16.png","32":"icons/icon32.png","48":"icons/icon48.png","128":"icons/icon128.png"};
manifest.action.default_icon={"16":"icons/icon16.png","32":"icons/icon32.png"};
for(const file of ["manifest.json","inspector.js","inspector.css","popup.html","popup.js","options.html","options.js"])await copyFile(file,path.join(out,file));
await writeFile(path.join(out,"manifest.json"),JSON.stringify(manifest,null,2));
await mkdir(path.join(out,"icons"),{recursive:true});
const sourceIcon=await readFile("assets/icon.svg");
for(const size of [16,32,48,128]) await sharp(sourceIcon).resize(size,size).png().toFile(path.join(out,"icons",`icon${size}.png`));
await build({entryPoints:["src/harper-worker-entry.js"],outfile:path.join(out,"harper-worker.js"),bundle:true,format:"iife",platform:"browser",target:["chrome120"],minify:true,logLevel:"warning",legalComments:"none",external:["fs"]});
await writeFile(path.join(out,"THIRD-PARTY-NOTICES.txt"),"Harper, Copyright Automattic and contributors. Licensed under Apache License 2.0. https://github.com/Automattic/harper\n");
console.log("Chrome Web Store package files built in dist/ (version "+manifest.version+").");
