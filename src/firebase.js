import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCU4n-m82TypmfLknSHELhizzx9GrniMPk",
  authDomain: "werewolf-game-e59f2.firebaseapp.com",
  projectId: "werewolf-game-e59f2",
  storageBucket: "werewolf-game-e59f2.firebasestorage.app",
  messagingSenderId: "644627307608",
  appId: "1:644627307608:web:0924af49b23ac0ae5bbe2d",
  measurementId: "G-59M0V6X2FK",
  databaseURL: "https://werewolf-game-e59f2-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);