import { initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getAuth,
  setPersistence,
  signInWithPopup,
  signOut,
} from "firebase/auth";

const firebaseApp = initializeApp({
  apiKey: "AIzaSyA_lfvEvzaoN5ERKU722uWpggspL-vriDo",
  authDomain: "coleridge-admin.firebaseapp.com",
  projectId: "coleridge-admin",
  appId: "1:766803260855:web:54de4b82e570107f6a6432",
});

export const adminAuth = getAuth(firebaseApp);

export const isLocalDevelopment = () =>
  ["localhost", "127.0.0.1", "0.0.0.0"].includes(window.location.hostname);

export const isOwnerRoute = () =>
  window.location.pathname === "/owner" || window.location.pathname.startsWith("/owner/");

export const adminHref = (section: "catalogue" | "specials" | "price-list" = "catalogue") => {
  const base = isOwnerRoute() ? "/owner" : "/admin";
  return section === "catalogue" ? `${base}/` : `${base}/${section}/`;
};

export const configureAdminPersistence = () =>
  setPersistence(adminAuth, browserLocalPersistence);

export const signInAdmin = async () => {
  await configureAdminPersistence();
  return signInWithPopup(adminAuth, new GoogleAuthProvider());
};

export const signOutAdmin = async () => {
  if (!isOwnerRoute()) {
    window.location.assign("/cdn-cgi/access/logout");
    return;
  }

  await signOut(adminAuth);
  window.location.replace("/owner/");
};

export const adminFetch = async (path: string, init: RequestInit = {}) => {
  if (!isOwnerRoute()) return fetch(`/admin-api${path}`, init);

  const token = await adminAuth.currentUser?.getIdToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("authorization", `Bearer ${token}`);
  return fetch(`/owner-api${path}`, { ...init, headers });
};
