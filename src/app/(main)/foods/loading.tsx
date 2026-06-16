export default function FoodsLoading() {
  return (
    <main>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <div className="h-8 w-24 animate-pulse rounded bg-zinc-200" />
          <div className="mt-2 h-4 w-48 animate-pulse rounded bg-zinc-100" />
        </div>
        <div className="h-9 w-24 animate-pulse rounded bg-zinc-200" />
      </header>

      <div className="mb-3 flex justify-end">
        <div className="h-5 w-32 animate-pulse rounded bg-zinc-100" />
      </div>

      <div className="table-shell overflow-x-auto">
        <table className="table-base min-w-[40rem]">
          <thead>
            <tr>
              <th className="th-base">Name</th>
              <th className="th-base">Hindi</th>
              <th className="th-base">Categories</th>
              <th className="th-base"></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i}>
                <td className="td-base"><div className="h-4 w-32 animate-pulse rounded bg-zinc-100" /></td>
                <td className="td-base"><div className="h-4 w-28 animate-pulse rounded bg-zinc-100" /></td>
                <td className="td-base"><div className="h-4 w-20 animate-pulse rounded bg-zinc-100" /></td>
                <td className="td-base"><div className="h-4 w-10 animate-pulse rounded bg-zinc-100" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
