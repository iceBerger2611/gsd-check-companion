import { atom } from "jotai";

export const LoadingProgressAtom = atom<{ loadingText: string } | null>(null);