export function DashboardPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Balance Card */}
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Total Balance</p>
          <p className="mt-2 text-3xl font-bold">$0.00</p>
        </div>

        {/* Income Card */}
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Income (This Month)</p>
          <p className="mt-2 text-3xl font-bold text-green-600">$0.00</p>
        </div>

        {/* Expenses Card */}
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Expenses (This Month)</p>
          <p className="mt-2 text-3xl font-bold text-red-600">$0.00</p>
        </div>

        {/* Transactions Card */}
        <div className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Transactions</p>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Spending by Category</h2>
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            Chart placeholder
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Monthly Trend</h2>
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            Chart placeholder
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="mt-8 rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Recent Transactions</h2>
        <div className="text-center text-muted-foreground">
          No transactions yet. Add your first transaction to get started!
        </div>
      </div>
    </div>
  );
}
