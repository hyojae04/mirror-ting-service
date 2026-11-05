// Deterministic, collision-free packing in SVG coordinates; frequency controls area.
export function layoutWorkplaceWords(words) {
  const placed = [];
  const max = Math.max(1, ...words.map(item => item.count));
  for (const item of [...words].sort((a,b) => b.count-a.count).slice(0,24)) {
    let size = 22 + 40 * Math.sqrt(item.count / max);
    let found = null;
    while (!found && size >= 16) {
      const width = [...item.word].length * size + 16;
      const height = size * 1.25 + 8;
      for (let step=0; step<1800; step++) {
        const angle = step * .3, radius = 2.8 * Math.sqrt(step);
        const x = 400 + Math.cos(angle) * radius * 2.4;
        const y = 160 + Math.sin(angle) * radius;
        const box = {left:x-width/2,right:x+width/2,top:y-height/2,bottom:y+height/2};
        if (box.left<12 || box.right>788 || box.top<12 || box.bottom>308) continue;
        if (placed.some(word => box.left<word.box.right && box.right>word.box.left && box.top<word.box.bottom && box.bottom>word.box.top)) continue;
        found = {...item,x,y,size,box}; break;
      }
      if (!found) size -= 2;
    }
    if (found) placed.push(found);
  }
  return placed;
}
