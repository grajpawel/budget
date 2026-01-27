export function TransactionsPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Add Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search transactions..."
          className="w-full max-w-xs rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
        <select className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
          <option value="">All Categories</option>
        </select>
        <input
          type="month"
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      {/* Transactions Table */}
      <div className="rounded-lg border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Date
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Description
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Category
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                Amount
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={5}
                className="px-4 py-8 text-center text-muted-foreground"
              >
                No transactions found. Add your first transaction to get started!
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
