import { requireFamily } from "@/lib/auth";
import { buildTemplateWorkbook } from "@/lib/import/template";

export const dynamic = "force-dynamic";

export async function GET() {
  // Family-only — redirects to /login otherwise.
  await requireFamily();

  const buf = buildTemplateWorkbook();
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="menu-planner-template.xlsx"',
    },
  });
}
