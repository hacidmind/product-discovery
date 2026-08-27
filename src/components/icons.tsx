import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };
function Icon({ size = 18, children, ...props }: IconProps) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{children}</svg>; }
const makeIcon = (paths: ReactNode) =>
  // eslint-disable-next-line react/display-name
  (props: IconProps) => <Icon {...props}>{paths}</Icon>;
export const Sparkles = makeIcon(<><path d="m12 3-1.2 5.4L6 10l4.8 1.6L12 17l1.2-5.4L18 10l-4.8-1.6L12 3Z"/><path d="m19 15-.5 2.3L16.5 18l2 .7.5 2.3.5-2.3 2-.7-2-.7-.5-2.3Z"/></>);
export const LayoutDashboard = makeIcon(<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></>);
export const Search = makeIcon(<><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></>);
export const Upload = makeIcon(<><path d="M12 16V4"/><path d="m8 8 4-4 4 4"/><path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/></>);
export const Target = makeIcon(<><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v2M22 12h-2M12 22v-2M2 12h2"/></>);
export const Users = makeIcon(<><circle cx="9" cy="8" r="3"/><path d="M3 20c.5-4 2.5-6 6-6s5.5 2 6 6"/><path d="M16 5c2.5 0 3.5 1.5 3.5 3.2 0 1.2-.6 2.2-1.6 2.7M17 14c2.3.4 3.5 2.2 4 4.5"/></>);
export const Mic = makeIcon(<><rect x="8" y="3" width="8" height="12" rx="4"/><path d="M5 11v1a7 7 0 0 0 14 0v-1M12 19v3M8 22h8"/></>);
export const ListChecks = makeIcon(<><path d="M9 6h11M9 12h11M9 18h11"/><path d="m3 6 1 1 2-2m-3 7 1 1 2-2m-3 7 1 1 2-2"/></>);
export const FlaskConical = makeIcon(<><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/><path d="M7.5 15h9"/></>);
export const ShieldQuestion = makeIcon(<><path d="M12 3 5 6v5c0 4.7 3 8.3 7 10 4-1.7 7-5.3 7-10V6l-7-3Z"/><path d="M9.7 10a2.3 2.3 0 1 1 3.7 1.8c-.9.7-1.4 1.2-1.4 2.2M12 17h.01"/></>);
export const Globe2 = makeIcon(<><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.4 2.5 3.5 5.5 3.5 9S14.4 18.5 12 21c-2.4-2.5-3.5-5.5-3.5-9S9.6 5.5 12 3Z"/></>);
export const GitBranch = makeIcon(<><circle cx="6" cy="5" r="2"/><circle cx="18" cy="19" r="2"/><circle cx="18" cy="8" r="2"/><path d="M6 7v5a7 7 0 0 0 7 7h3M8 5h2a6 6 0 0 1 6 6v5"/></>);
export const Moon = makeIcon(<path d="M20 15.5A8 8 0 0 1 8.5 4 8 8 0 1 0 20 15.5Z"/>); export const Sun = makeIcon(<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>);
export const PanelLeftClose = makeIcon(<><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M14 9l-3 3 3 3"/></>); export const PanelLeftOpen = makeIcon(<><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M12 9l3 3-3 3"/></>); export const Command = makeIcon(<path d="M9 9a3 3 0 1 1-3-3 3 3 0 0 1 3 3v6a3 3 0 1 1-3-3h12a3 3 0 1 1 3 3 3 3 0 0 1-3-3V9a3 3 0 1 1 3 3H6"/>);
export const AlertTriangle = makeIcon(<><path d="M12 3 2.8 20h18.4L12 3Z"/><path d="M12 9v4M12 17h.01"/></>); export const ArrowUpRight = makeIcon(<><path d="M7 17 17 7M9 7h8v8"/></>); export const BarChart3 = makeIcon(<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>); export const BrainCircuit = makeIcon(<><path d="M9 4a3 3 0 0 0-5 2.2A3 3 0 0 0 5 12a3 3 0 0 0 4 4.8M15 4a3 3 0 0 1 5 2.2A3 3 0 0 1 19 12a3 3 0 0 1-4 4.8M9 4v16M15 4v16M9 8h6M9 16h6"/></>); export const Download = makeIcon(<><path d="M12 3v12M8 11l4 4 4-4M4 20h16"/></>); export const FileDown = Download; export const Lightbulb = makeIcon(<><path d="M9 18h6M10 22h4M8.5 15.5C7 14.3 6 12.4 6 10a6 6 0 1 1 12 0c0 2.4-1 4.3-2.5 5.5V18h-7v-2.5Z"/></>); export const MessageSquare = makeIcon(<><path d="M4 4h16v12H8l-4 4V4Z"/></>);
export const User = makeIcon(<><circle cx="12" cy="7" r="4"/><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/></>);
export const Mail = makeIcon(<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>);
export const Lock = makeIcon(<><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></>);
export const LogOut = makeIcon(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></>);
export const ArrowRight = makeIcon(<><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>);
