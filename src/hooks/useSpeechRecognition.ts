"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface BrowserSpeechRecognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult: ((event: {
    resultIndex: number;
    results: { length: number; [index: number]: { isFinal: boolean; 0: { transcript: string } } };
  }) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionCtor = new () => BrowserSpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

export function useSpeechRecognition(lang = "en-ZA") {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);

  useEffect(() => {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    setSupported(Boolean(Ctor));
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(
    (onResult: (transcript: string, isFinal: boolean) => void) => {
      const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
      if (!Ctor) {
        setError("Voice search isn't supported in this browser.");
        return;
      }

      recognitionRef.current?.abort();
      setError(null);

      const rec = new Ctor();
      recognitionRef.current = rec;
      rec.lang = lang;
      rec.interimResults = true;
      rec.continuous = false;

      rec.onstart = () => setListening(true);
      rec.onend = () => setListening(false);
      rec.onerror = (event) => {
        setListening(false);
        if (event.error === "not-allowed") {
          setError("Microphone access was blocked.");
        } else if (event.error !== "aborted") {
          setError("Couldn't hear you — try again.");
        }
      };
      rec.onresult = (event) => {
        let transcript = "";
        let isFinal = false;
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
          if (event.results[i].isFinal) isFinal = true;
        }
        onResult(transcript.trim(), isFinal);
      };

      rec.start();
    },
    [lang],
  );

  useEffect(
    () => () => {
      recognitionRef.current?.abort();
    },
    [],
  );

  return { supported, listening, error, start, stop, clearError: () => setError(null) };
}
