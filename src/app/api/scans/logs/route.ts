import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const barcode = searchParams.get("barcode");

    if (!barcode) {
      return NextResponse.json(
        { error: "Barcode parameter is required" },
        { status: 400 },
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 503 },
      );
    }

    const { data: logs, error } = await supabase
      .from("scans_logs")
      .select("*")
      .eq("barcode", barcode)
      .eq("source_table", "scans")
      .order("created_at", { ascending: false })
      .limit(50); // Limit to last 50 logs to avoid performance issues

    if (error) {
      throw error;
    }

    return NextResponse.json(logs || []);
  } catch (error) {
    console.error("GET logs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch scan logs" },
      { status: 500 },
    );
  }
}
