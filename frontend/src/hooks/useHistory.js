import { useState, useEffect, useCallback } from "react";

const KEY = "yesno_history";
const MAX = 8;

export function useHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      // ignore corrupt storage
    }
  }, []);

  const persist = useCallback((next) => {
    setHistory(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // ignore quota errors
    }
  }, []);

  const addQuestion = useCallback(
    (question) => {
      const q = question.trim();
      if (!q) return;
      setHistory((prev) => {
        const next = [q, ...prev.filter((item) => item.toLowerCase() !== q.toLowerCase())].slice(0, MAX);
        try {
          localStorage.setItem(KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    []
  );

  const clearHistory = useCallback(() => persist([]), [persist]);

  return { history, addQuestion, clearHistory };
}
