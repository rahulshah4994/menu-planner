"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const MAX_VISIBLE = 2;

export function CategoryCell({ categories }: { categories: string[] }) {
  const list = categories ?? [];
  const visible = list.slice(0, MAX_VISIBLE);
  const hidden = list.slice(MAX_VISIBLE);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setCoords({ top: r.bottom + 4, left: r.left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function close() {
      setOpen(false);
    }
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || popRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <div className="flex min-w-[10rem] max-w-[16rem] flex-wrap items-center gap-1">
      {visible.map((c) => (
        <span key={c} className="tag-soft">
          {c}
        </span>
      ))}
      {hidden.length > 0 && (
        <>
          <button
            ref={btnRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={`Show ${hidden.length} more categories`}
            title={list.join(", ")}
            className="tag-soft cursor-pointer hover:bg-zinc-200"
          >
            +{hidden.length}
          </button>
          {open && (
            <div
              ref={popRef}
              role="tooltip"
              style={{ top: coords.top, left: coords.left }}
              className="fixed z-50 min-w-[10rem] max-w-[18rem] rounded-md border border-zinc-200 bg-white p-2 shadow-lg"
            >
              <div className="flex flex-wrap gap-1">
                {list.map((c) => (
                  <span key={c} className="tag-soft">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
