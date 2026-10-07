import { useState } from "react";

/**
A button that counts its clicks.
*/
export function Counter({ initialCount }: { readonly initialCount: number }) {
  const [count, setCount] = useState(initialCount);
  return (
    <button
      type="button"
      onClick={() => {
        setCount(count + 1);
      }}
    >
      Clicked {count} times
    </button>
  );
}
