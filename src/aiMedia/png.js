// Encodeur PNG minimal (sans dépendance) : sert au fournisseur de DÉMONSTRATION (visuels d'attente déterministes, jamais présentés comme générés par une IA).
const zlib = require("node:zlib");
const crypto = require("node:crypto");

const TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n += 1) { let c = n; for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = TABLE[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const body = Buffer.concat([Buffer.from(type), data]); const sum = Buffer.alloc(4); sum.writeUInt32BE(crc(body)); return Buffer.concat([len, body, sum]); };
function encode(width, height, pixel) {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y += 1) { raw[y * (width * 3 + 1)] = 0; for (let x = 0; x < width; x += 1) { const [r, g, b] = pixel(x, y); const o = y * (width * 3 + 1) + 1 + x * 3; raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; } }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
// Dégradé diagonal + bandes, couleurs dérivées de la consigne : même consigne → même image
function placeholder(width, height, seedText) {
  const h = crypto.createHash("sha256").update(String(seedText)).digest();
  const a = [h[0] % 90 + 20, h[1] % 90 + 40, h[2] % 120 + 90], b = [h[3] % 60 + 170, h[4] % 60 + 170, h[5] % 60 + 180];
  const band = (h[6] % 5) + 3;
  return encode(width, height, (x, y) => {
    const t = (x / width + y / height) / 2, stripe = Math.floor((x + y) / (Math.max(width, height) / band)) % 2 ? 0.08 : 0;
    return a.map((v, i) => Math.round(v + (b[i] - v) * Math.min(1, t + stripe)));
  });
}
module.exports = { encode, placeholder };
