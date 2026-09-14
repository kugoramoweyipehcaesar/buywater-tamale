/** Minimal PNG encoder – solid brand icon for PWA (no native deps). */
import zlib from "zlib";

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
    }
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

/**
 * Generate a square PNG Buffer (RGB) – blue #0077C8 with white droplet circle.
 * @param {number} size
 */
export function makeBuyWaterPng(size = 512) {
  const r = 0;
  const g = 119;
  const b = 200;
  const rows = [];
  const cx = size / 2;
  const cy = size / 2;
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3);
    row[0] = 0; // filter none
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - cx, y - cy);
      let pr = r;
      let pg = g;
      let pb = b;
      if (d < size * 0.28) {
        pr = 255;
        pg = 255;
        pb = 255;
      } else if (d < size * 0.34) {
        pr = 160;
        pg = 210;
        pb = 240;
      }
      // droplet-ish darker blue inside white
      if (d < size * 0.18) {
        const dy = y - cy + size * 0.05;
        const drop = Math.hypot(x - cx, dy * 1.15);
        if (drop < size * 0.12) {
          pr = 0;
          pg = 119;
          pb = 200;
        }
      }
      const i = 1 + x * 3;
      row[i] = pr;
      row[i + 1] = pg;
      row[i + 2] = pb;
    }
    rows.push(row);
  }
  const raw = Buffer.concat(rows);
  const compressed = zlib.deflateSync(raw, { level: 9 });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
