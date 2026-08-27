import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

const DATA_DIR = path.join(process.cwd(), "data");

export async function GET() {
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));

  const bundle: Record<string, unknown> = {};

  for (const file of files) {
    const key = file.replace(/\.json$/, "");
    const raw = fs.readFileSync(path.join(DATA_DIR, file), "utf-8");
    bundle[key] = JSON.parse(raw);
  }

  const body = JSON.stringify(bundle, null, 2);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="product-discovery-export.json"`,
    },
  });
}