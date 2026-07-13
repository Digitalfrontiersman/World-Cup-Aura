import { useEffect, useState } from "react";

// Animated counter — counts 0 → `to` at 60fps over `duration` seconds.
export function CountUp({ to, duration = 2 }: { to: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = to / (duration * 60);
    const handle = setInterval(() => {
      start += increment;
      if (start >= to) {
        setCount(to);
        clearInterval(handle);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(handle);
  }, [to, duration]);

  return <span>{count}</span>;
}
