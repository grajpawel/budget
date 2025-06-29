import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  getFirestore,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "./firebase";
import type { Transaction } from "./types/Transaction";
import { normalizePkoBp } from "./utils/normalizePkoBp";
import { saveTransactions, updateCategory as updateCategoryService } from "./services/firestore";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  // Sign in with Google popup
  const signIn = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch(console.error);
  };

  // Sign out
  const signOut = () => auth.signOut();

  // Load user and transactions on auth state change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        setLoading(true);
        const q = query(collection(db, "users", u.uid, "transactions"));
        const snapshot = await getDocs(q);
        const txs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Transaction),
        }));
        setTransactions(txs);
        setLoading(false);
      } else {
        setTransactions([]);
      }
    });
    return unsubscribe;
  }, []);

  // Save new transactions to Firestore
  const handleSaveTransactions = async (txs: Transaction[], userId: string) => {
    await saveTransactions(db, txs, userId);
  };

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: { data: any[]; }) => {
        const normalized = results.data.map(normalizePkoBp);
        setTransactions((prev) => [...prev, ...normalized]);
        await handleSaveTransactions(normalized, user.uid);
      },
    });
  };

  // Update category in Firestore and state
  const updateCategory = async (
    docId: string | undefined,
    newCategory: string,
    index: number
  ) => {
    if (!user || !docId) return;

    await updateCategoryService(db, user.uid, docId, newCategory);

    // Update local state
    setTransactions((prev) => {
      const updated = [...prev];
      updated[index].category = newCategory;
      return updated;
    });
  };

  // Group transactions by category
  const groupedTransactions = transactions.reduce<
    Record<string, Transaction[]>
  >((acc, tx) => {
    const cat = tx.category || "Uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(tx);
    return acc;
  }, {});

  if (!user) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Personal Budget App</h1>
        <button onClick={signIn}>Sign in with Google</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Welcome {user.displayName}</h1>
      <button onClick={signOut}>Sign Out</button>

      <div style={{ marginTop: 20 }}>
        <input type="file" accept=".csv" onChange={handleFileUpload} />
      </div>

      {loading ? (
        <p>Loading transactions...</p>
      ) : (
        Object.entries(groupedTransactions).map(([category, txs]) => (
          <div key={category} style={{ marginTop: 30 }}>
            <h2>{category}</h2>
            <table border={1} cellPadding={5} style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Operation Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Description</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {txs.map((tx, idx) => (
                  <tr key={tx.id || idx}>
                    <td>{tx.operationDate}</td>
                    <td>{tx.transactionType}</td>
                    <td>{tx.amount.toFixed(2)}</td>
                    <td>{tx.description}</td>
                    <td>
                      <select
                        value={tx.category || ""}
                        onChange={(e) =>
                          updateCategory(tx.id, e.target.value, idx)
                        }
                      >
                        <option value="">-- Choose category --</option>
                        <option value="Food">Food</option>
                        <option value="Transport">Transport</option>
                        <option value="Salary">Salary</option>
                        <option value="Entertainment">Entertainment</option>
                        <option value="Other">Other</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}

export default App;