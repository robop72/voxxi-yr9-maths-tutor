"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function ParentPinPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("voxxi-parent-auth") === "true") {
      router.replace("/parent/dashboard");
    }
  }, [router]);

  function handleDigit(d: string) {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError("");
    if (next.length === 4) {
      setTimeout(() => verify(next), 150);
    }
  }

  function handleBack() {
    setPin(p => p.slice(0, -1));
    setError("");
  }

  function verify(entered: string) {
    const stored = localStorage.getItem("voxxi-parent-pin") ?? "1234";
    if (entered === stored) {
      sessionStorage.setItem("voxxi-parent-auth", "true");
      router.push("/parent/dashboard");
    } else {
      setShake(true);
      setPin("");
      setError("Incorrect PIN. Please try again.");
      setTimeout(() => setShake(false), 500);
    }
  }

  const DIGITS = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["", "0", "⌫"],
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image src="/voxii-logo.png" alt="Voxii" width={120} height={38} className="dark:invert" />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <h1 className="text-xl font-semibold text-center text-gray-800 dark:text-gray-100 mb-1">
            Parent Portal
          </h1>
          <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-8">
            Enter your 4-digit PIN to continue
          </p>

          {/* PIN dots */}
          <div className={`flex justify-center gap-4 mb-6 ${shake ? "animate-shake" : ""}`}>
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                  i < pin.length
                    ? "bg-blue-500 border-blue-500"
                    : "bg-transparent border-gray-300 dark:border-gray-600"
                }`}
              />
            ))}
          </div>

          {error && (
            <p className="text-sm text-center text-red-500 mb-4">{error}</p>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3">
            {DIGITS.flat().map((d, idx) => {
              if (d === "") return <div key={idx} />;
              if (d === "⌫") {
                return (
                  <button
                    key={idx}
                    onClick={handleBack}
                    className="h-14 rounded-xl text-lg font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition-all"
                  >
                    {d}
                  </button>
                );
              }
              return (
                <button
                  key={idx}
                  onClick={() => handleDigit(d)}
                  className="h-14 rounded-xl text-xl font-semibold text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition-all"
                >
                  {d}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-6">
            Default PIN: 1234 &mdash; change in Settings
          </p>
        </div>

        <button
          onClick={() => router.push("/")}
          className="mt-6 w-full text-sm text-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          ← Back to tutor
        </button>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
}
