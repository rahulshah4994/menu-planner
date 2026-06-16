"use client";
import { useRouter } from "next/navigation";

export function ShowArchivedToggle({ showArchived }: { showArchived: boolean }) {
  const router = useRouter();
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-600">
      <input
        type="checkbox"
        checked={showArchived}
        onChange={(e) =>
          router.push(e.target.checked ? "/foods?showArchived=1" : "/foods")
        }
        className="h-4 w-4 rounded border-zinc-300"
      />
      Show archived
    </label>
  );
}
