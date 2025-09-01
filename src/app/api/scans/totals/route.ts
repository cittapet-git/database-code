import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 503 },
      );
    }

    // Consulta 1: Contar códigos de barras únicos (Total de Códigos)
    const { count: totalCodes, error: codesError } = await supabase
      .from("scans")
      .select("*", { count: "exact", head: true });

    if (codesError) {
      throw codesError;
    }

    // Consulta 2: Sumar todas las cantidades usando función SQL
    const { data: totalProductsScanned, error: sumError } = await supabase
      .rpc('sum_all_quantities');

    if (sumError) {
      throw sumError;
    }

    return NextResponse.json({
      totalCodes: totalCodes || 0,
      totalProductsScanned: totalProductsScanned,
    });
  } catch (error) {
    console.error("GET totals error:", error);
    return NextResponse.json(
      { error: "Failed to fetch totals" },
      { status: 500 },
    );
  }
}
