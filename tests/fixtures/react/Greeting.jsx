/**
Greets `name`. The component imports nothing, so it lints without the React peers.
*/
export const Greeting = ({ name }) => {
  return <p className="greeting">Hello, {name}!</p>;
};
