"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

// ✅ Lazy load Lottie to prevent "document is not defined" error
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });
import loadingAnimation from "@/public/loading.json"; 

const CodeExplainer = () => {
  const [code, setCode] = useState("");
  const [level, setLevel] = useState("beginner");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [typedResponse, setTypedResponse] = useState("");

  // ✅ Prevents hydration errors
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleExplain = async () => {
    setLoading(true);
    setResponse("");
    setTypedResponse("");

    try {
      const res = await fetch("https://code-analyser-backend.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `Explain the following code to a ${level}:\n\n${code}` }),
      });

      const data = await res.json();
      setResponse(data.reply || "No explanation found.");

      // ✅ Faster typing effect
      let index = 0;
      const typingSpeed = Math.max(3, 500 / data.reply.length); 

      const interval = setInterval(() => {
        setTypedResponse((prev) => prev + data.reply[index]);
        index++;
        if (index >= data.reply.length) clearInterval(interval);
      }, typingSpeed);
    } catch (error) {
      console.error("Frontend Error:", error);
      setResponse("Error fetching explanation. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Prevents hydration mismatch
  if (!isMounted) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-4xl mx-auto p-8 space-y-6 bg-white shadow-lg rounded-xl border border-gray-200"
    >
      <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
        AI-Powered Code Explainer
      </h1>

      <Textarea
        className="w-full h-36 resize-none border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 transition"
        placeholder="Paste your code here..."
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      <Select onValueChange={setLevel} defaultValue={level}>
        <SelectTrigger className="border-gray-300 w-full rounded-lg focus:ring-2 focus:ring-blue-400 transition">
          <SelectValue placeholder="Select explanation level" />
        </SelectTrigger>
        <SelectContent className="border-gray-300">
          <SelectItem value="beginner">Beginner</SelectItem>
          <SelectItem value="intermediate">Intermediate</SelectItem>
          <SelectItem value="expert">Expert</SelectItem>
        </SelectContent>
      </Select>

      <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
        <Button
          onClick={handleExplain}
          disabled={loading}
          className="w-full py-3 text-lg font-semibold rounded-lg transition bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? "Explaining..." : "Explain Code"}
        </Button>
      </motion.div>

      {loading && (
        <div className="flex justify-center">
          <Lottie animationData={loadingAnimation} className="w-24 h-24" />
        </div>
      )}

      {typedResponse && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-6 border rounded-lg bg-gray-50 shadow-md"
        >
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }: React.ComponentProps<"code"> & { node?: any; inline?: boolean }) {
                const match = /language-(\w+)/.exec(className || "");
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    className="rounded-lg overflow-hidden"
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                ) : (
                  <code className="bg-gray-200 text-red-500 px-2 py-1 rounded-md" {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {typedResponse}
          </ReactMarkdown>
        </motion.div>
      )}
    </motion.div>
  );
};

export default CodeExplainer;
