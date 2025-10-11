import { Injectable } from '@angular/core';
import { Firestore, collection, query, where, orderBy, getDocs } from '@angular/fire/firestore';

export interface HistoryItem {
  id: string;
  type: string;
  amount: number;
  note?: string;
  timestamp: any;
}

@Injectable({ providedIn: 'root' })
export class HistoryService {
  constructor(private firestore: Firestore) {}

  async getUserHistory(userId: string): Promise<HistoryItem[]> {
    const historyRef = collection(this.firestore, 'history');
    const q = query(historyRef, where('userId', '==', userId), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as HistoryItem[];
  }
}
