// const messages = [
//   "Processing your order...",
//   "Packing items...",
//   "Shipping soon...",
// ];

import { useState } from "react";
import TypewriterText from "./LiveTypingAnimation";

const MultiTypewriter = ({messages}) => {
  const [textIndex, setTextIndex] = useState(0);
  const safeMessages = Array.isArray(messages) ? messages.filter(Boolean) : [];
  if (!safeMessages.length) {
    return null;
  }

  return (
    <TypewriterText
      text={safeMessages[textIndex]}
      onComplete={() =>
        setTextIndex((prev) => (prev + 1) % safeMessages.length)
      }
    />
  );
};

export default MultiTypewriter;