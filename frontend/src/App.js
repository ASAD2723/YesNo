import { useState, useEffect } from "react";
import "@/App.css";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

import { Header } from "@/components/yesno/Header";
import { SearchBox } from "@/components/yesno/SearchBox";
import { LoadingState } from "@/components/yesno/LoadingState";
import { AnswerDisplay } from "@/components/yesno/AnswerDisplay";
import { ExampleQuestions } from "@/components/yesno/ExampleQuestions";
import { History } from "@/components/yesno/History";
import { useHistory } from "@/hooks/useHistory";
import { askQuestion, getShared } from "@/lib/api";

function App() {
  const [question, setQuestion] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const { history, addQuestion, clearHistory } = useHistory();

  const answered = Boolean(result || loading || error);

  // Load a shared answer from ?shared={id}
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get("shared");
    if (!sharedId) return;
    setLoading(true);
    getShared(sharedId)
      .then((data) => {
        setSubmitted(data.question);
        setQuestion(data.question);
        setResult(data.result);
      })
      .catch(() => setError("This shared answer could not be found."))
      .finally(() => {
        setLoading(false);
        window.history.replaceState({}, "", window.location.pathname);
      });
  }, []);

  const runQuery = async (q) => {
    const trimmed = (q || "").trim();
    if (trimmed.length < 3) {
      toast.error("Please enter a clear yes or no question.");
      return;
    }
    setSubmitted(trimmed);
    setResult(null);
    setError("");
    setLoading(true);
    try {
      const data = await askQuestion(trimmed);
      setResult(data);
      addQuestion(trimmed);
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (q) => {
    setQuestion(q);
    runQuery(q);
  };

  const reset = () => {
    setQuestion("");
    setSubmitted("");
    setResult(null);
    setError("");
    setLoading(false);
  };

  return (
    <div className="App">
      <div className="grain-overlay" />
      <Header onReset={reset} />

      <main className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-3xl flex-col items-center justify-center px-6 md:px-10 py-28">
        {/* Intro — only on the empty state */}
        <AnimatePresence>
          {!answered && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mb-10 text-center"
            >
              <h1 className="font-serif-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-black leading-[1.05]">
                Ask anything.
                <br />
                Get a clear answer.
              </h1>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The search box is always present, animates position via layout */}
        <div className="w-full">
          <SearchBox
            value={question}
            onChange={setQuestion}
            onSubmit={runQuery}
            disabled={loading}
            compact={answered}
          />
        </div>

        {/* Result region */}
        <div className="w-full mt-10">
          <AnimatePresence mode="wait">
            {loading && <LoadingState key="loading" />}

            {!loading && error && (
              <motion.div
                key="error"
                data-testid="error-message"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center text-center py-10"
              >
                <AlertCircle className="h-7 w-7 text-neutral-400 mb-3" />
                <p className="text-lg text-neutral-700">{error}</p>
                <button
                  type="button"
                  data-testid="retry-button"
                  onClick={() => runQuery(submitted)}
                  className="mt-5 rounded-full border border-neutral-200 bg-white px-6 py-2.5 text-sm font-medium hover:border-black transition-colors"
                >
                  Try again
                </button>
              </motion.div>
            )}

            {!loading && !error && result && (
              <AnswerDisplay key={submitted} result={result} question={submitted} />
            )}

            {!answered && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-12"
              >
                <ExampleQuestions onSelect={handleSelect} />
                <History history={history} onSelect={handleSelect} onClear={clearHistory} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Toaster position="top-center" />
    </div>
  );
}

export default App;
