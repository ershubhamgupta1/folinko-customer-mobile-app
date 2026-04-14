// const messages = [
//   "Processing your order...",
//   "Packing items...",
//   "Shipping soon...",
// ];

import { useState } from "react";
import TypewriterText from "./LiveTypingAnimation";

const MultiTypewriter = ({messages}) => {
  const [textIndex, setTextIndex] = useState(0);

  return (
    <TypewriterText
      text={messages[textIndex]}
      onComplete={() =>
        setTextIndex((prev) => (prev + 1) % messages.length)
      }
    />
  );
};

export default MultiTypewriter;