import { requireFamily } from "@/lib/auth";
import { buildFoodsTemplateWorkbook } from "@/lib/v2/import";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireFamily();
  const buf = buildFoodsTemplateWorkbook();
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="menu-planner-v2-foods-template.xlsx"',
    },
  });
}
