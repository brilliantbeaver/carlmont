// usage: node svg2png.js in.svg out.png [density]
const sharp=require('/opt/cowork-node-tools/node_modules/sharp');
const [,,i,o,d]=process.argv;
sharp(i,{density:+(d||150)}).flatten({background:'#ffffff'}).png().toFile(o).then(r=>console.log(o,r.width+'x'+r.height)).catch(e=>{console.error('ERR',e.message);process.exit(1)});
