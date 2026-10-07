import { formatDate } from "./format-date.js";

type Reading = {
  readonly degrees: number;
  readonly scale: Scale;
  readonly takenAt: Date;
};
type Scale = "celsius" | "fahrenheit";

const freezingFahrenheit = 32;
const fahrenheitPerCelsius = 1.8;

/**
Converts the degrees of `reading` to `scale`.
*/
function convert(reading: Reading, scale: Scale): Reading {
  if (reading.scale === scale) return reading;
  const degrees =
    scale === "celsius"
      ? (reading.degrees - freezingFahrenheit) / fahrenheitPerCelsius
      : reading.degrees * fahrenheitPerCelsius + freezingFahrenheit;
  return { ...reading, degrees, scale };
}
/**
Describes `reading`, such as "21 °C on October 7, 2026".
*/
function formatReading(reading: Reading): string {
  const unit = reading.scale === "celsius" ? "°C" : "°F";
  return `${String(Math.round(reading.degrees))} ${unit} on ${formatDate(reading.takenAt)}`;
}

export { convert, formatReading };
