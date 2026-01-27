export function CategoriesPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Add Category
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Default categories placeholder */}
        {['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities', 'Health'].map(
          (category) => (
            <div
              key={category}
              className="flex items-center justify-between rounded-lg border bg-card p-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full bg-primary" />
                <span className="font-medium">{category}</span>
              </div>
              <div className="flex gap-2">
                <button className="text-sm text-muted-foreground hover:text-foreground">
                  Edit
                </button>
                <button className="text-sm text-destructive hover:text-destructive/80">
                  Delete
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {/* Category Rules Section */}
      <div className="mt-8">
        <h2 className="mb-4 text-xl font-semibold">Auto-categorization Rules</h2>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-center text-muted-foreground">
            Set up rules to automatically categorize your transactions based on
            keywords or patterns.
          </p>
          <div className="mt-4 text-center">
            <button className="text-sm text-primary hover:underline">
              Create your first rule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
