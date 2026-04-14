import React, { useEffect, useState } from "react";
import { Text } from "react-native";

const TypewriterText = ({
  text = "Hello, this is a typing animation",
  speed = 80,
  delay = 1500, // wait before restart
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let timeout;

    if (index < text.length) {
      timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index]);
        setIndex(index + 1);
      }, speed);
    } else {
      // Reset after delay
      timeout = setTimeout(() => {
        setDisplayedText("");
        setIndex(0);
      }, delay);
    }

    return () => clearTimeout(timeout);
  }, [index, text]);

  return (
    <Text style={{ fontSize: 14, color: 'rgb(30 41 59 / var(--tw-text-opacity, 1))' }}>
      {displayedText}
    </Text>
  );
};

export default TypewriterText;