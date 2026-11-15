/**
 * qrCode.ts - Pure TypeScript QR Code generator (no external dependencies)
 * Generates standards-compliant ISO/IEC 18004 QR Codes as 2D boolean matrix.
 * Supports versions 1 to 40, Byte mode, Reed-Solomon error correction,
 * and optimal masking.
 */

export interface QrMatrix {
  size: number;
  modules: boolean[][];
}

export type ErrorCorrectionLevel = "LOW" | "MEDIUM" | "QUARTILE" | "HIGH";

interface EccConfig {
  ordinal: number;
  formatBits: number;
}

const ECC_CONFIG: Record<ErrorCorrectionLevel, EccConfig> = {
  LOW: { ordinal: 0, formatBits: 1 },
  MEDIUM: { ordinal: 1, formatBits: 0 },
  QUARTILE: { ordinal: 2, formatBits: 3 },
  HIGH: { ordinal: 3, formatBits: 2 },
};

// ISO/IEC 18004 Error Correction Codewords per block
const ECC_CODEWORDS_PER_BLOCK: number[][] = [
  [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
];

// Number of Error Correction Blocks per version
const NUM_ERROR_CORRECTION_BLOCKS: number[][] = [
  [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
];

class ReedSolomonGenerator {
  private coefficients: number[];

  constructor(degree: number) {
    if (degree < 1 || degree > 255) throw new RangeError("Degree out of range");
    this.coefficients = [];
    for (let i = 0; i < degree - 1; i++) this.coefficients.push(0);
    this.coefficients.push(1);

    let root = 1;
    for (let i = 0; i < degree; i++) {
      for (let j = 0; j < this.coefficients.length; j++) {
        this.coefficients[j] = ReedSolomonGenerator.multiply(this.coefficients[j], root);
        if (j + 1 < this.coefficients.length) this.coefficients[j] ^= this.coefficients[j + 1];
      }
      root = ReedSolomonGenerator.multiply(root, 0x02);
    }
  }

  getRemainder(data: Uint8Array): number[] {
    const result: number[] = this.coefficients.map(() => 0);
    for (const b of data) {
      const factor = b ^ (result.shift() ?? 0);
      result.push(0);
      this.coefficients.forEach((coef, i) => {
        result[i] ^= ReedSolomonGenerator.multiply(coef, factor);
      });
    }
    return result;
  }

  private static multiply(x: number, y: number): number {
    let z = 0;
    for (let i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11d);
      z ^= ((y >>> i) & 1) * x;
    }
    return z;
  }
}

class QrCodeInternal {
  readonly version: number;
  readonly size: number;
  readonly modules: boolean[][];
  private readonly isFunction: boolean[][];

  constructor(
    version: number,
    ecl: EccConfig,
    dataCodewords: Uint8Array,
    mask: number = -1
  ) {
    if (version < 1 || version > 40) throw new RangeError("Version out of range");
    this.version = version;
    this.size = version * 4 + 17;

    this.modules = Array.from({ length: this.size }, () =>
      Array(this.size).fill(false)
    );
    this.isFunction = Array.from({ length: this.size }, () =>
      Array(this.size).fill(false)
    );

    this.drawFunctionPatterns();
    const allCodewords = this.addEccAndInterleave(version, ecl, dataCodewords);
    this.drawCodewords(allCodewords);

    // Auto-select optimal mask pattern if -1
    let chosenMask = mask;
    if (chosenMask === -1) {
      let minPenalty = 1e9;
      let bestMask = 0;
      for (let i = 0; i < 8; i++) {
        this.applyMask(i);
        this.drawFormatBits(ecl, i);
        const penalty = this.getPenaltyScore();
        if (penalty < minPenalty) {
          minPenalty = penalty;
          bestMask = i;
        }
        this.applyMask(i); // undo
      }
      chosenMask = bestMask;
    }

    this.applyMask(chosenMask);
    this.drawFormatBits(ecl, chosenMask);
  }

  private setFunctionModule(x: number, y: number, isDark: boolean): void {
    this.modules[y][x] = isDark;
    this.isFunction[y][x] = true;
  }

  private drawFunctionPatterns(): void {
    const size = this.size;
    // Timing patterns
    for (let i = 0; i < size; i++) {
      this.setFunctionModule(6, i, i % 2 === 0);
      this.setFunctionModule(i, 6, i % 2 === 0);
    }
    // Finder patterns & separators
    this.drawFinderPattern(3, 3);
    this.drawFinderPattern(size - 4, 3);
    this.drawFinderPattern(3, size - 4);

    // Alignment patterns
    const alignPatPos = QrCodeInternal.getAlignmentPatternPositions(this.version);
    const numAlign = alignPatPos.length;
    for (let i = 0; i < numAlign; i++) {
      for (let j = 0; j < numAlign; j++) {
        if (
          (i === 0 && j === 0) ||
          (i === 0 && j === numAlign - 1) ||
          (i === numAlign - 1 && j === 0)
        )
          continue;
        this.drawAlignmentPattern(alignPatPos[i], alignPatPos[j]);
      }
    }

    // Reserve format & version
    this.drawFormatBits(ECC_CONFIG.MEDIUM, 0);
    this.drawVersion();
  }

  private drawFinderPattern(x: number, y: number): void {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        const xx = x + dx;
        const yy = y + dy;
        if (xx >= 0 && xx < this.size && yy >= 0 && yy < this.size) {
          this.setFunctionModule(xx, yy, dist !== 2 && dist !== 4);
        }
      }
    }
  }

  private drawAlignmentPattern(x: number, y: number): void {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        this.setFunctionModule(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
  }

  private drawFormatBits(ecl: EccConfig, mask: number): void {
    const data = (ecl.formatBits << 3) | mask;
    let rem = data;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits = ((data << 10) | rem) ^ 0x5412;

    for (let i = 0; i <= 5; i++) this.setFunctionModule(8, i, ((bits >>> i) & 1) !== 0);
    this.setFunctionModule(8, 7, ((bits >>> 6) & 1) !== 0);
    this.setFunctionModule(8, 8, ((bits >>> 7) & 1) !== 0);
    this.setFunctionModule(7, 8, ((bits >>> 8) & 1) !== 0);
    for (let i = 9; i < 15; i++) this.setFunctionModule(14 - i, 8, ((bits >>> i) & 1) !== 0);

    const size = this.size;
    for (let i = 0; i < 8; i++) this.setFunctionModule(size - 1 - i, 8, ((bits >>> i) & 1) !== 0);
    for (let i = 8; i < 15; i++) this.setFunctionModule(8, size - 15 + i, ((bits >>> i) & 1) !== 0);
    this.setFunctionModule(8, size - 8, true); // Dark module
  }

  private drawVersion(): void {
    if (this.version < 7) return;
    let rem = this.version;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (this.version << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const a = this.size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      const bit = ((bits >>> i) & 1) !== 0;
      this.setFunctionModule(a, b, bit);
      this.setFunctionModule(b, a, bit);
    }
  }

  private addEccAndInterleave(
    ver: number,
    ecl: EccConfig,
    data: Uint8Array
  ): number[] {
    const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][ver];
    const blockEccLen = ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][ver];
    const rawCodewords = Math.floor(QrCodeInternal.getNumRawDataModules(ver) / 8);
    const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
    const shortBlockLen = Math.floor(rawCodewords / numBlocks);

    const blocks: { data: Uint8Array; ecc: number[] }[] = [];
    const rs = new ReedSolomonGenerator(blockEccLen);
    let k = 0;
    for (let i = 0; i < numBlocks; i++) {
      const datLen = shortBlockLen - blockEccLen + (i >= numShortBlocks ? 1 : 0);
      const dat = data.slice(k, k + datLen);
      k += datLen;
      const ecc = rs.getRemainder(dat);
      blocks.push({ data: dat, ecc });
    }

    const result: number[] = [];
    for (let i = 0; i < shortBlockLen - blockEccLen + 1; i++) {
      for (let j = 0; j < numBlocks; j++) {
        if (i < blocks[j].data.length) result.push(blocks[j].data[i]);
      }
    }
    for (let i = 0; i < blockEccLen; i++) {
      for (let j = 0; j < numBlocks; j++) {
        result.push(blocks[j].ecc[i]);
      }
    }
    return result;
  }

  private drawCodewords(data: number[]): void {
    const size = this.size;
    let i = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          const upward = ((right + 1) & 2) === 0;
          const y = upward ? size - 1 - vert : vert;
          if (!this.isFunction[y][x] && i < data.length * 8) {
            this.modules[y][x] = ((data[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0;
            i++;
          }
        }
      }
    }
  }

  private applyMask(mask: number): void {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (!this.isFunction[y][x]) {
          let invert = false;
          switch (mask) {
            case 0: invert = (x + y) % 2 === 0; break;
            case 1: invert = y % 2 === 0; break;
            case 2: invert = x % 3 === 0; break;
            case 3: invert = (x + y) % 3 === 0; break;
            case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
            case 5: invert = ((x * y) % 2) + ((x * y) % 3) === 0; break;
            case 6: invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; break;
            case 7: invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0; break;
          }
          if (invert) this.modules[y][x] = !this.modules[y][x];
        }
      }
    }
  }

  private getPenaltyScore(): number {
    let result = 0;
    const size = this.size;
    // N1: runs of same color in rows & cols
    for (let y = 0; y < size; y++) {
      let runColor = false;
      let runX = 0;
      for (let x = 0; x < size; x++) {
        if (x === 0 || this.modules[y][x] !== runColor) {
          runColor = this.modules[y][x];
          runX = 1;
        } else {
          runX++;
          if (runX === 5) result += 3;
          else if (runX > 5) result += 1;
        }
      }
    }
    for (let x = 0; x < size; x++) {
      let runColor = false;
      let runY = 0;
      for (let y = 0; y < size; y++) {
        if (y === 0 || this.modules[y][x] !== runColor) {
          runColor = this.modules[y][x];
          runY = 1;
        } else {
          runY++;
          if (runY === 5) result += 3;
          else if (runY > 5) result += 1;
        }
      }
    }
    // N2: 2x2 blocks of same color
    for (let y = 0; y < size - 1; y++) {
      for (let x = 0; x < size - 1; x++) {
        const color = this.modules[y][x];
        if (
          color === this.modules[y][x + 1] &&
          color === this.modules[y + 1][x] &&
          color === this.modules[y + 1][x + 1]
        ) {
          result += 3;
        }
      }
    }
    // N4: balance of dark & light modules
    let dark = 0;
    for (const row of this.modules) {
      for (const color of row) if (color) dark++;
    }
    const total = size * size;
    const k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
    result += k * 10;
    return result;
  }

  static getNumDataCodewords(ver: number, ecl: EccConfig): number {
    return (
      Math.floor(QrCodeInternal.getNumRawDataModules(ver) / 8) -
      ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][ver] *
        NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][ver]
    );
  }

  static getNumRawDataModules(ver: number): number {
    let result = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      const numAlign = Math.floor(ver / 7) + 2;
      result -= (25 * numAlign - 10) * numAlign - 55;
      if (ver >= 7) result -= 36;
    }
    return result;
  }

  static getAlignmentPatternPositions(ver: number): number[] {
    if (ver === 1) return [];
    const numAlign = Math.floor(ver / 7) + 2;
    const step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (numAlign * 2 - 2)) * 2;
    const result = [6];
    for (let pos = ver * 4 + 10; result.length < numAlign; pos -= step) {
      result.splice(1, 0, pos);
    }
    return result;
  }
}

/**
 * Generate standard QR code matrix from text
 * Automatically selects smallest version (1-40) that accommodates the text length.
 */
export function generateQrMatrix(
  text: string,
  eclLevel: ErrorCorrectionLevel = "MEDIUM"
): QrMatrix {
  const ecl = ECC_CONFIG[eclLevel];
  const encoder = new TextEncoder();
  const textBytes = encoder.encode(text || "SATPAMO");

  // Determine smallest version that fits
  let chosenVersion = 1;
  let dataCapacityBits = 0;
  for (let ver = 1; ver <= 40; ver++) {
    const capCodewords = QrCodeInternal.getNumDataCodewords(ver, ecl);
    const capBits = capCodewords * 8;
    const countBits = ver < 10 ? 8 : 16;
    const neededBits = 4 + countBits + textBytes.length * 8;
    if (neededBits <= capBits) {
      chosenVersion = ver;
      dataCapacityBits = capBits;
      break;
    }
    if (ver === 40) {
      chosenVersion = 40;
      dataCapacityBits = capBits;
    }
  }

  // Construct bit stream (Byte mode = 0100)
  const bitArray: number[] = [];
  const pushBits = (val: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) {
      bitArray.push((val >>> i) & 1);
    }
  };

  pushBits(0b0100, 4);
  const countBits = chosenVersion < 10 ? 8 : 16;
  pushBits(textBytes.length, countBits);
  for (const b of textBytes) {
    pushBits(b, 8);
  }

  // Terminator
  const termLength = Math.min(4, dataCapacityBits - bitArray.length);
  for (let i = 0; i < termLength; i++) bitArray.push(0);

  // Pad to multiple of 8
  while (bitArray.length % 8 !== 0) bitArray.push(0);

  // Pad bytes alternating 0xEC, 0x11
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bitArray.length < dataCapacityBits) {
    const pb = padBytes[padIdx % 2];
    for (let i = 7; i >= 0; i--) bitArray.push((pb >>> i) & 1);
    padIdx++;
  }

  // Convert to byte array
  const dataCodewords = new Uint8Array(bitArray.length / 8);
  for (let i = 0; i < dataCodewords.length; i++) {
    let byteVal = 0;
    for (let j = 0; j < 8; j++) byteVal = (byteVal << 1) | bitArray[i * 8 + j];
    dataCodewords[i] = byteVal;
  }

  const qr = new QrCodeInternal(chosenVersion, ecl, dataCodewords);

  return {
    size: qr.size,
    modules: qr.modules,
  };
}
