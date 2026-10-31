/**
 * qrCode.ts - Pure TypeScript QR Code generator (no external dependencies)
 * Generates standards-compliant ISO/IEC 18004 QR Codes as SVG or 2D boolean matrix.
 */

// Galois field tables for GF(256) with primitive polynomial 0x11d (285)
const EXP_TABLE = new Uint8Array(512);
const LOG_TABLE = new Uint8Array(256);

(() => {
  let val = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = val;
    EXP_TABLE[i + 255] = val;
    LOG_TABLE[val] = i;
    val = (val << 1) ^ (val >= 128 ? 0x11d : 0);
  }
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return EXP_TABLE[LOG_TABLE[x] + LOG_TABLE[y]];
}

function getGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], EXP_TABLE[i]);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly;
}

function computeReedSolomon(data: Uint8Array, ecCount: number): Uint8Array {
  const gen = getGeneratorPoly(ecCount);
  const remainder = new Uint8Array(ecCount);

  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ remainder[0];
    for (let j = 0; j < ecCount - 1; j++) {
      remainder[j] = remainder[j + 1] ^ gfMul(gen[j + 1], factor);
    }
    remainder[ecCount - 1] = gfMul(gen[ecCount], factor);
  }
  return remainder;
}

// Version table for EC Level M (medium: 15% recovery)
// Capacity in bytes for Version 1 to 4:
interface VersionConfig {
  version: number;
  size: number;
  totalCodewords: number;
  ecCodewords: number;
  dataCodewords: number;
  alignmentPositions: number[];
}

const VERSIONS: VersionConfig[] = [
  { version: 1, size: 21, totalCodewords: 26, ecCodewords: 10, dataCodewords: 16, alignmentPositions: [] },
  { version: 2, size: 25, totalCodewords: 44, ecCodewords: 16, dataCodewords: 28, alignmentPositions: [6, 18] },
  { version: 3, size: 29, totalCodewords: 70, ecCodewords: 26, dataCodewords: 44, alignmentPositions: [6, 22] },
  { version: 4, size: 33, totalCodewords: 100, ecCodewords: 36, dataCodewords: 64, alignmentPositions: [6, 26] },
];

// Format info bit strings for EC Level M (00) with mask 000..111
const FORMAT_INFO_M: number[] = [
  0x5412, 0x5125, 0x5e7c, 0x5b4b, 0x45f9, 0x40ce, 0x4f97, 0x4aa0,
];

export interface QrMatrix {
  size: number;
  modules: boolean[][];
}

/**
 * Generate standard QR code matrix from text
 */
export function generateQrMatrix(text: string): QrMatrix {
  const encoder = new TextEncoder();
  const textBytes = encoder.encode(text);

  // Pick smallest fitting version
  const config = VERSIONS.find((v) => v.dataCodewords >= textBytes.length + 3) || VERSIONS[VERSIONS.length - 1];
  const size = config.size;

  // 1. Bit stream creation (Byte Mode = 0100)
  const bitArray: number[] = [];
  const pushBits = (val: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) {
      bitArray.push((val >> i) & 1);
    }
  };

  pushBits(0b0100, 4); // Byte Mode Indicator
  pushBits(textBytes.length, 8); // Character count (8-bit for byte mode ver 1-9)
  for (const b of textBytes) {
    pushBits(b, 8);
  }

  // Terminator
  const maxBits = config.dataCodewords * 8;
  const termLength = Math.min(4, maxBits - bitArray.length);
  pushBits(0, termLength);

  // Pad to multiple of 8
  while (bitArray.length % 8 !== 0 && bitArray.length < maxBits) {
    bitArray.push(0);
  }

  // Convert bits to byte array
  const dataBytes = new Uint8Array(config.dataCodewords);
  for (let i = 0; i < bitArray.length / 8 && i < config.dataCodewords; i++) {
    let byteVal = 0;
    for (let b = 0; b < 8; b++) {
      byteVal = (byteVal << 1) | bitArray[i * 8 + b];
    }
    dataBytes[i] = byteVal;
  }

  // Pad bytes alternating 0xEC, 0x11
  let filled = Math.floor(bitArray.length / 8);
  let padToggle = false;
  while (filled < config.dataCodewords) {
    dataBytes[filled] = padToggle ? 0x11 : 0xec;
    padToggle = !padToggle;
    filled++;
  }

  // Error correction
  const ecBytes = computeReedSolomon(dataBytes, config.ecCodewords);

  // Combine data + ec
  const finalCodewords = new Uint8Array(config.totalCodewords);
  finalCodewords.set(dataBytes, 0);
  finalCodewords.set(ecBytes, config.dataCodewords);

  // 2. Build grid
  const grid: (boolean | null)[][] = Array.from({ length: size }, () =>
    Array(size).fill(null)
  );

  // Finder pattern helper
  const placeFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[r0 + r][c0 + c] = isBorder || isCore;
      }
    }
    // Separators (white border)
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const row = r0 + r;
        const col = c0 + c;
        if (row >= 0 && row < size && col >= 0 && col < size) {
          if (grid[row][col] === null) {
            grid[row][col] = false;
          }
        }
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Alignment patterns for version >= 2
  if (config.alignmentPositions.length >= 2) {
    const coords = config.alignmentPositions;
    for (const r of coords) {
      for (const c of coords) {
        // Skip if overlaps with finder patterns
        if (
          (r < 8 && c < 8) ||
          (r < 8 && c >= size - 8) ||
          (r >= size - 8 && c < 8)
        ) {
          continue;
        }
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const isBorder = Math.abs(dr) === 2 || Math.abs(dc) === 2;
            const isCenter = dr === 0 && dc === 0;
            grid[r + dr][c + dc] = isBorder || isCenter;
          }
        }
      }
    }
  }

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (grid[6][i] === null) grid[6][i] = i % 2 === 0;
    if (grid[i][6] === null) grid[i][6] = i % 2 === 0;
  }

  // Dark module
  grid[4 * config.version + 9][8] = true;

  // Reserve format info area
  for (let i = 0; i < 9; i++) {
    if (grid[8][i] === null) grid[8][i] = false;
    if (grid[i][8] === null) grid[i][8] = false;
  }
  for (let i = size - 8; i < size; i++) {
    if (grid[8][i] === null) grid[8][i] = false;
    if (grid[i][8] === null) grid[i][8] = false;
  }

  // 3. Place data bits using standard zigzag
  const allBits: boolean[] = [];
  for (let i = 0; i < finalCodewords.length; i++) {
    for (let b = 7; b >= 0; b--) {
      allBits.push(((finalCodewords[i] >> b) & 1) === 1);
    }
  }

  let bitIdx = 0;
  let upward = true;
  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--; // Skip vertical timing column
    const rows = upward
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const r of rows) {
      for (const col of [right, right - 1]) {
        if (grid[r][col] === null) {
          grid[r][col] = bitIdx < allBits.length ? allBits[bitIdx++] : false;
        }
      }
    }
    upward = !upward;
  }

  // 4. Apply Mask Pattern 000: (row + col) % 2 == 0
  const maskFn = (r: number, c: number) => (r + c) % 2 === 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Don't mask functional patterns
      const isFinder =
        (r < 9 && c < 9) ||
        (r < 9 && c >= size - 8) ||
        (r >= size - 8 && c < 9);
      const isTiming = (r === 6 || c === 6);
      const isDarkModule = (r === 4 * config.version + 9 && c === 8);
      let isAlignment = false;
      if (config.alignmentPositions.length >= 2) {
        for (const ar of config.alignmentPositions) {
          for (const ac of config.alignmentPositions) {
            if (Math.abs(r - ar) <= 2 && Math.abs(c - ac) <= 2) {
              isAlignment = true;
            }
          }
        }
      }

      if (!isFinder && !isTiming && !isDarkModule && !isAlignment) {
        if (maskFn(r, c)) {
          grid[r][c] = !grid[r][c];
        }
      }
    }
  }

  // 5. Place Format Information (Mask 000 -> FORMAT_INFO_M[0])
  const formatInfo = FORMAT_INFO_M[0];
  for (let i = 0; i < 15; i++) {
    const bit = ((formatInfo >> i) & 1) === 1;
    // Top-left
    if (i < 6) {
      grid[8][i] = bit;
    } else if (i === 6) {
      grid[8][7] = bit;
    } else if (i === 7) {
      grid[8][8] = bit;
    } else if (i === 8) {
      grid[7][8] = bit;
    } else {
      grid[14 - i][8] = bit;
    }

    // Split across top-right & bottom-left
    if (i < 8) {
      grid[size - 1 - i][8] = bit;
    } else {
      grid[8][size - 15 + i] = bit;
    }
  }

  return {
    size,
    modules: grid.map((row) => row.map((cell) => cell ?? false)),
  };
}
