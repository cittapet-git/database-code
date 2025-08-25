import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { supabase, ScanRecord } from "@/lib/supabase";

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

async function syncToDatabase(barcode: string, quantity: number, now: string, isNewBarcode: boolean, responsible: string) {
  // Fire-and-forget database sync - never blocks the main flow
  setImmediate(async () => {
    try {
      // Skip if Supabase client is not available
      if (!supabase) {
        return;
      }

      if (isNewBarcode) {
        const { error: insertError } = await supabase
          .from('scans')
          .insert({
            barcode,
            quantity: 1,
            first_scan: now,
            last_scan: now,
            responsible,
          });

        if (insertError) {
          console.warn('Database sync failed (insert):', insertError.message);
        }
      } else {
        const { error: updateError } = await supabase
          .from('scans')
          .update({
            quantity,
            last_scan: now,
            responsible,
          })
          .eq('barcode', barcode);

        if (updateError) {
          console.warn('Database sync failed (update):', updateError.message);
        }
      }
    } catch (error) {
      console.warn('Database sync failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  });
}

export async function POST(request: Request) {
  try {
    const { barcode, responsible } = await request.json();

    if (!barcode || !responsible) {
      return NextResponse.json(
        { error: "Barcode and responsible are required" },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    // Primary functionality: Update local JSON file (never fails the request)
    const barcodes = await readBarcodesFile();
    let isNewBarcode = false;

    if (barcodes[barcode]) {
      barcodes[barcode].quantity += 1;
      barcodes[barcode].lastScanned = now;
    } else {
      isNewBarcode = true;
      barcodes[barcode] = {
        barcode,
        quantity: 1,
        lastScanned: now,
        firstScanned: now,
      };
    }

    await writeBarcodesFile(barcodes);

    // Optional: Attempt database sync (never blocks or fails the request)
    syncToDatabase(barcode, barcodes[barcode].quantity, now, isNewBarcode, responsible);

    // Always return success based on JSON file operation
    return NextResponse.json(barcodes[barcode]);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: "Failed to process barcode scan" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    // Primary functionality: Always return local JSON data
    const localBarcodes = await readBarcodesFile();
    
    // Optional: Try to get database data (never blocks or fails the request)
    let databaseData = null;
    if (supabase) {
      try {
        const { data: supabaseScans, error } = await supabase
          .from('scans')
          .select('*')
          .order('last_scan', { ascending: false });

        if (!error && supabaseScans) {
          databaseData = supabaseScans;
        }
      } catch (dbError) {
        console.warn('Database fetch failed:', dbError instanceof Error ? dbError.message : 'Unknown error');
      }
    }

    // Always return local data, with optional database data if available
    return NextResponse.json({
      ...localBarcodes,
      _metadata: {
        source: 'local',
        databaseSynced: databaseData !== null,
        ...(databaseData && { databaseRecords: databaseData })
      }
    });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: "Failed to fetch scan data" },
      { status: 500 },
    );
  }
}