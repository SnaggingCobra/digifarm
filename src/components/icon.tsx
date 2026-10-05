type IconName =
  | "sprout"
  | "arrow-right"
  | "arrow-up-right"
  | "check"
  | "leaf"
  | "sun"
  | "water"
  | "wallet"
  | "notebook"
  | "calendar"
  | "close"
  | "menu"
  | "plus"
  | "logout"
  | "eye"
  | "eye-off"
  | "chevron-down"
  | "mountain";

export function Icon({ name }: { name: IconName }) {
  const commonProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className: "h-4 w-4",
  };

  switch (name) {
    case "sprout":
      return (
        <svg {...commonProps}>
          <path d="M8 20c0-5 4-8 8-8 2 0 4 1 4 4 0 5-5 8-11 8-3 0-5-2-5-4 0-2 2-3 4-3Z" />
          <path d="M8 20c0-5-2-8-6-10" />
          <path d="M12 12c0-4 2-7 6-9" />
        </svg>
      );
    case "arrow-right":
      return (
        <svg {...commonProps}>
          <path d="M5 12h14" />
          <path d="m13 5 7 7-7 7" />
        </svg>
      );
    case "arrow-up-right":
      return (
        <svg {...commonProps}>
          <path d="M7 17 17 7" />
          <path d="M8 7h9v9" />
        </svg>
      );
    case "check":
      return (
        <svg {...commonProps}>
          <path d="m5 12 4 4 10-10" />
        </svg>
      );
    case "leaf":
      return (
        <svg {...commonProps}>
          <path d="M19 4c-5 0-9 2-12 7 2 7 8 11 15 11 2-8 0-15-3-18Z" />
          <path d="M7 17c2-3 5-5 12-7" />
        </svg>
      );
    case "sun":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
        </svg>
      );
    case "water":
      return (
        <svg {...commonProps}>
          <path d="M12 3.5c3.5 4 7 7 7 10.5A7 7 0 1 1 5 14c0-3.5 3.5-6.5 7-10.5Z" />
          <path d="M9 15c.8 1 1.7 1.5 3 1.5 1.8 0 2.8-.9 3-2" />
        </svg>
      );
    case "wallet":
      return (
        <svg {...commonProps}>
          <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6H18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 15.5v-7Z" />
          <path d="M15 12h5" />
          <circle cx="16" cy="12" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "notebook":
      return (
        <svg {...commonProps}>
          <path d="M7 4.5h10A2.5 2.5 0 0 1 19.5 7v12a2.5 2.5 0 0 1-2.5 2.5H7A2.5 2.5 0 0 1 4.5 19V7A2.5 2.5 0 0 1 7 4.5Z" />
          <path d="M8 8h8M8 12h8M8 16h6" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...commonProps}>
          <rect x="3.5" y="5" width="17" height="15" rx="2" />
          <path d="M8 3.5v3M16 3.5v3M3.5 10h17" />
        </svg>
      );
    case "close":
      return (
        <svg {...commonProps}>
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      );
    case "menu":
      return (
        <svg {...commonProps}>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      );
    case "plus":
      return (
        <svg {...commonProps}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "logout":
      return (
        <svg {...commonProps}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="M16 17l5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
      );
    case "eye":
      return (
        <svg {...commonProps}>
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "eye-off":
      return (
        <svg {...commonProps}>
          <path d="M3 3l18 18" />
          <path d="M10.6 10.6A2 2 0 0 0 13.4 13.4" />
          <path d="M9.2 5.7A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a16.8 16.8 0 0 1-4.1 5.1M6.1 6.1A17 17 0 0 0 2 12s3.5 7 10 7a11.8 11.8 0 0 0 4.7-1" />
        </svg>
      );
    case "chevron-down":
      return (
        <svg {...commonProps}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      );
    case "mountain":
      return (
        <svg {...commonProps}>
          <path d="M3 18 10 8l4 6 5-7 2 11H3Z" />
          <path d="M6 18h12" />
        </svg>
      );
    default:
      return null;
  }
}
