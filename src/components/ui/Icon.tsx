import Svg, { Circle, Path } from "react-native-svg";

export type IconName =
  | "user"
  | "users"
  | "chevR"
  | "chevL"
  | "check"
  | "close"
  | "alert";

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

/** Line icons ported from the prototype (aura-shared.jsx). 24×24 viewBox. */
export function Icon({
  name,
  size = 22,
  color = "currentColor",
  strokeWidth = 1.6,
}: Props) {
  const p = {
    fill: "none",
    stroke: color,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === "user" && (
        <>
          <Circle {...p} cx={12} cy={8} r={4} />
          <Path {...p} d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
        </>
      )}
      {name === "users" && (
        <>
          <Circle {...p} cx={9} cy={8} r={3.5} />
          <Path {...p} d="M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7" />
          <Circle {...p} cx={17} cy={7} r={2.5} />
          <Path {...p} d="M22 18c0-2.5-2-4.5-4.5-4.5" />
        </>
      )}
      {name === "chevR" && <Path {...p} d="M9 6l6 6-6 6" />}
      {name === "chevL" && <Path {...p} d="M15 6l-6 6 6 6" />}
      {name === "check" && <Path {...p} d="M5 12l5 5 9-10" strokeWidth={2.2} />}
      {name === "close" && <Path {...p} d="M6 6l12 12M18 6L6 18" />}
      {name === "alert" && (
        <Path {...p} d="M12 3l10 18H2L12 3zM12 10v5M12 18v.1" />
      )}
    </Svg>
  );
}
