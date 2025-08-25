import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface BarcodeEntry {
  barcode: string;
  quantity: number;
  lastScanned: string;
  firstScanned: string;
}

async function logScanActivity(
  scansId: number,
  barcode: string,
  delta: number,
  quantityAfter: number,
  actorName: string,
): Promise<void> {
  if (!supabase) {
    throw new Error("Database not available");
  }

  const { error } = await supabase.from("scans_logs").insert({
    scans_id: scansId,
    source_table: "scans",
    barcode,
    delta,
    quantity_after: quantityAfter,
    actor_name: actorName,
  });

  if (error) {
    console.error("Failed to log scan activity:", error);
    // Don't throw error to avoid breaking the main operation
  }
}

async function updateBarcodeInDatabase(
  barcode: string,
  responsible: string,
  now: string,
  increment: number = 1,
): Promise<BarcodeEntry> {
  if (!supabase) {
    throw new Error("Database not available");
  }

  // First, try to get existing record
  const { data: existingRecord } = await supabase
    .from("scans")
    .select("*")
    .eq("barcode", barcode)
    .single();

  if (existingRecord) {
    // Update existing record
    const newQuantity = Math.max(0, existingRecord.quantity + increment);
    const { data: updatedRecord, error } = await supabase
      .from("scans")
      .update({
        quantity: newQuantity,
        last_scan: now,
        responsible,
      })
      .eq("barcode", barcode)
      .select()
      .single();

    if (error) throw error;

    // Log the activity
    await logScanActivity(
      updatedRecord.id,
      barcode,
      increment,
      newQuantity,
      responsible,
    );

    return {
      barcode: updatedRecord.barcode,
      quantity: updatedRecord.quantity,
      lastScanned: updatedRecord.last_scan,
      firstScanned: updatedRecord.first_scan,
    };
  } else {
    // Create new record only if increment is positive
    if (increment <= 0) {
      throw new Error("Cannot create new record with negative quantity");
    }

    const { data: newRecord, error } = await supabase
      .from("scans")
      .insert({
        barcode,
        quantity: increment,
        first_scan: now,
        last_scan: now,
        responsible,
      })
      .select()
      .single();

    if (error) throw error;

    // Log the activity for new record
    await logScanActivity(
      newRecord.id,
      barcode,
      increment,
      increment, // For new records, quantity_after equals the increment
      responsible,
    );

    return {
      barcode: newRecord.barcode,
      quantity: newRecord.quantity,
      lastScanned: newRecord.last_scan,
      firstScanned: newRecord.first_scan,
    };
  }
}

export async function POST(request: Request) {
  try {
    const { barcode, responsible, increment = 1 } = await request.json();

    if (!barcode || !responsible) {
      return NextResponse.json(
        { error: "Barcode and responsible are required" },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    // Use database as primary storage
    const barcodeEntry = await updateBarcodeInDatabase(
      barcode,
      responsible,
      now,
      increment,
    );

    return NextResponse.json(barcodeEntry);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process barcode scan",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 503 },
      );
    }

    const { data: scans, error } = await supabase
      .from("scans")
      .select("*")
      .order("last_scan", { ascending: false });

    if (error) {
      throw error;
    }

    // Transform database records to match frontend interface
    const transformedScans: { [key: string]: BarcodeEntry } = {};
    if (scans && Array.isArray(scans)) {
      scans.forEach((scan) => {
        transformedScans[scan.barcode] = {
          barcode: scan.barcode,
          quantity: scan.quantity,
          lastScanned: scan.last_scan,
          firstScanned: scan.first_scan,
        };
      });
    }

    return NextResponse.json(transformedScans);
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch scan data" },
      { status: 500 },
    );
  }
}
