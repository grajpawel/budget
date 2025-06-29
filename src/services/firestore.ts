import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import type { Transaction } from "../types/Transaction";

export const saveTransactions = async (
  db: any,
  txs: Transaction[],
  userId: string
) => {
  const colRef = collection(db, "users", userId, "transactions");
  for (const tx of txs) {
    await addDoc(colRef, tx);
  }
};

export const updateCategory = async (
  db: any,
  userId: string,
  docId: string | undefined,
  newCategory: string
) => {
  if (!docId) return;
  const docRef = doc(db, "users", userId, "transactions", docId);
  await updateDoc(docRef, { category: newCategory });
};