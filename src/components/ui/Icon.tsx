import Svg, { Circle, Path, Rect } from "react-native-svg";

export type IconName =
  | "user"
  | "users"
  | "chevR"
  | "chevL"
  | "check"
  | "close"
  | "alert"
  | "calendar"
  | "clipboard"
  | "clock"
  | "home"
  | "search"
  | "message"
  | "sparkle"
  | "pencil"
  | "camera"
  | "shield"
  | "star"
  | "starOutline";

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
      {name === "calendar" && (
        <>
          <Rect {...p} x={3} y={5} width={18} height={16} rx={2.5} />
          <Path {...p} d="M3 9.5h18M8 3v4M16 3v4" />
        </>
      )}
      {name === "clipboard" && (
        <>
          <Rect {...p} x={5} y={4.5} width={14} height={16} rx={2.5} />
          <Rect {...p} x={9} y={3} width={6} height={3.5} rx={1.2} />
          <Path {...p} d="M9 11h6M9 15h4" />
        </>
      )}
      {name === "clock" && (
        <>
          <Circle {...p} cx={12} cy={12} r={9} />
          <Path {...p} d="M12 7.5V12l3 1.8" />
        </>
      )}
      {name === "home" && (
        <Path {...p} d="M4 10.5L12 4l8 6.5M6 9.5V20h12V9.5" />
      )}
      {name === "search" && (
        <>
          <Circle {...p} cx={11} cy={11} r={7} />
          <Path {...p} d="M20 20l-3.5-3.5" />
        </>
      )}
      {name === "message" && (
        <Path
          {...p}
          d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 4V6z"
        />
      )}
      {name === "sparkle" && (
        <Path
          {...p}
          d="M12 3l1.8 7.2L21 12l-7.2 1.8L12 21l-1.8-7.2L3 12l7.2-1.8L12 3z"
        />
      )}
      {name === "pencil" && (
        <>
          <Path {...p} d="M12 20h9" />
          <Path
            {...p}
            d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"
          />
        </>
      )}
      {name === "camera" && (
        <>
          <Path
            {...p}
            d="M4 8.5a2 2 0 0 1 2-2h1.5l1-2h5l1 2H18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8z"
          />
          <Circle {...p} cx={12} cy={12.5} r={3} />
        </>
      )}
      {name === "shield" && (
        <Path {...p} d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3zM9 12l2 2 4-4" />
      )}
      {name === "star" && (
        <Path
          {...p}
          fill={color}
          d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
        />
      )}
      {name === "starOutline" && (
        <Path
          {...p}
          d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
        />
      )}
    </Svg>
  );
}
