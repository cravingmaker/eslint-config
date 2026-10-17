import { useCallback, useState } from "react";

/**
A custom hook in a module without JSX: holds a boolean and a function that flips it.
*/
export const useToggle = (isInitiallyOn: boolean) => {
  const [isOn, setIsOn] = useState(isInitiallyOn);
  const toggle = useCallback(() => {
    setIsOn(!isOn);
  }, [isOn]);
  return [isOn, toggle] as const;
};
