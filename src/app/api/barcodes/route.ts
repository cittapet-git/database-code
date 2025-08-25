import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const BARCODES_FILE = path.join(process.cwd(), "data", "barcodes.json");

interface BarcodeEntry {
  barcode: string;
  quantity: number;
  lastScanned: string;
  firstScanned: string;
}

interface BarcodesData {
  [barcode: string]: BarcodeEntry;
}

async function readBarcodesFile(): Promise<BarcodesData> {
  try {
    const data = await fs.readFile(BARCODES_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

async function writeBarcodesFile(data: BarcodesData): Promise<void> {
  await fs.writeFile(BARCODES_FILE, JSON.stringify(data, null, 2));
}

export async function GET() {
  try {
    const barcodes = await readBarcodesFile();
    return NextResponse.json(barcodes);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to read barcodes" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { barcode } = await request.json();

    if (!barcode) {
      return NextResponse.json(
        { error: "Barcode is required" },
        { status: 400 },
      );
    }

    const barcodes = await readBarcodesFile();
    const now = new Date().toISOString();

    if (barcodes[barcode]) {
      barcodes[barcode].quantity += 1;
      barcodes[barcode].lastScanned = now;
    } else {
      barcodes[barcode] = {
        barcode,
        quantity: 1,
        lastScanned: now,
        firstScanned: now,
      };
    }

    await writeBarcodesFile(barcodes);

    return NextResponse.json(barcodes[barcode]);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process barcode" },
      { status: 500 },
    );
  }
}
