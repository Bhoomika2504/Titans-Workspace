import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const logActivity = async (userName, role, action, details) => {
  try {
    await addDoc(collection(db, "activity_logs"), {
      userName: userName || "Bhoomika Wandhekar", //
      role: role || "President", //
      action: action, // e.g., "Posted Notice"
      details: details, // e.g., "Technical Workshop Update"
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
};