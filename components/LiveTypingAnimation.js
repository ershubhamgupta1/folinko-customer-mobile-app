import React, { useEffect, useState } from "react";
import { Text } from "react-native";

const TypewriterText = ({
  text = "Hello, this is a typing animation",
  speed = 80,
  delay = 1500, // wait before restart
  onComplete,
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setDisplayedText("");
    setIndex(0);
  }, [text]);

  useEffect(() => {
    let timeout;

    if (!text) {
      setDisplayedText("");
      setIndex(0);
      return undefined;
    }

    if (index < text.length) {
      timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index]);
        setIndex(index + 1);
      }, speed);
    } else {
      timeout = setTimeout(() => {
        if (typeof onComplete === "function") {
          onComplete();
          return;
        }

        setDisplayedText("");
        setIndex(0);
      }, delay);
    }

    return () => clearTimeout(timeout);
  }, [delay, index, onComplete, speed, text]);

  return (
    <Text style={{ fontSize: 14, color: 'rgb(30 41 59 / var(--tw-text-opacity, 1))' }}>
      {displayedText}
    </Text>
  );
};

export default TypewriterText;