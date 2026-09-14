/** PNG encoder – BuyWater icon matching water-drop + waves on blue. */
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

function encodePng(size, paint) {
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3);
    row[0] = 0;
    for (let x = 0; x < size; x++) {
      const [pr, pg, pb] = paint(x, y, size);
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
  ihdr[8] = 8;
  ihdr[9] = 2;
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

/** Point-in-droplet: classic water drop shape (point up, round bottom). */
function inDroplet(x, y, size) {
  const cx = size * 0.5;
  const cy = size * 0.42;
  const dx = (x - cx) / size;
  const dy = (y - cy) / size;
  // upper tip
  if (dy < 0) {
    const width = 0.22 * (1 + dy * 2.2);
    if (width <= 0) return false;
    return Math.abs(dx) < width * (1 + dy * 0.5) && dy > -0.22;
  }
  // lower bulb (ellipse)
  return (dx * dx) / (0.16 * 0.16) + (dy * dy) / (0.2 * 0.2) <= 1;
}

/** Soft wave band near bottom. */
function inWaves(x, y, size) {
  const ny = y / size;
  if (ny < 0.62 || ny > 0.88) return false;
  const nx = x / size;
  const wave1 = 0.7 + 0.03 * Math.sin(nx * Math.PI * 3);
  const wave2 = 0.76 + 0.025 * Math.sin(nx * Math.PI * 3 + 1.2);
  const wave3 = 0.82 + 0.02 * Math.sin(nx * Math.PI * 3 + 2.1);
  const t = 0.012;
  if (Math.abs(ny - wave1) < t) return true;
  if (Math.abs(ny - wave2) < t) return true;
  if (Math.abs(ny - wave3) < t) return true;
  return false;
}

/**
 * App icon: blue background #0077C8, white droplet + waves (matches provided art).
 */
export function makeBuyWaterPng(size = 512) {
  const BR = 0;
  const BG = 119;
  const BB = 200;
  return encodePng(size, (x, y, s) => {
    if (inDroplet(x, y, s) || inWaves(x, y, s)) {
      // highlight on droplet
      if (inDroplet(x, y, s)) {
        const hx = x - s * 0.42;
        const hy = y - s * 0.38;
        if (hx * hx + hy * hy < (s * 0.04) * (s * 0.04)) {
          return [240, 248, 255];
        }
      }
      return [255, 255, 255];
    }
    return [BR, BG, BB];
  });
}

/** Wide/narrow screenshot placeholders for PWABuilder */
export function makeScreenshotPng(width, height) {
  const BR = 0;
  const BG = 119;
  const BB = 200;
  const rows = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 3);
    row[0] = 0;
    for (let x = 0; x < width; x++) {
      let pr = BR;
      let pg = BG;
      let pb = BB;
      // center icon area
      const cx = width / 2;
      const cy = height * 0.4;
      const scale = Math.min(width, height);
      const dx = x - cx;
      const dy = y - cy;
      // reuse droplet in center
      const sx = cx + dx;
      const sy = cy + dy;
      // map to 512-space for shape tests roughly
      const sim = scale * 0.55;
      const lx = ((x - (cx - sim / 2)) / sim) * 512;
      const ly = ((y - (cy - sim / 2)) / sim) * 512;
      if (lx >= 0 && lx < 512 && ly >= 0 && ly < 512) {
        if (inDroplet(lx, ly, 512) || inWaves(lx, ly, 512)) {
          pr = 255;
          pg = 255;
          pb = 255;
        }
      }
      // title bar band
      if (y > height * 0.72 && y < height * 0.8) {
        pr = 255;
        pg = 255;
        pb = 255;
      }
      const i = 1 + x * 3;
      row[i] = pr;
      row[i + 1] = pg;
      row[i + 2] = pb;
    }
    rows.push(row);
  }
  const raw = Buffer.concat(rows);
  const compressed = zlib.deflateSync(raw, { level: 6 });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
