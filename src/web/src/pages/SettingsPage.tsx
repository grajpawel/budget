export function SettingsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>

      <div className="max-w-2xl space-y-6">
        {/* Profile Section */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                type="email"
                disabled
                className="w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Display Name
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                placeholder="Your name"
              />
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Preferences</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Currency</label>
              <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="PLN">PLN (zł)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Date Format
              </label>
              <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Management Section */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Data Management</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Export Data</p>
                <p className="text-sm text-muted-foreground">
                  Download all your transactions as CSV
                </p>
              </div>
              <button className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent">
                Export
              </button>
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <p className="font-medium text-destructive">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <button className="rounded-lg border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground">
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
