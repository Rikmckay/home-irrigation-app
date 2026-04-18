import { NavLink } from 'react-router-dom'
import { Map, Cpu, Box, Link2, Zap, Droplets } from 'lucide-react'

const links = [
  { to: '/', label: 'Map', icon: Map },
  { to: '/controllers', label: 'Controllers', icon: Cpu },
  { to: '/valve-boxes', label: 'Valve Boxes', icon: Box },
  { to: '/connection-boxes', label: 'Conn. Boxes', icon: Link2 },
  { to: '/valves', label: 'Valves', icon: Zap },
  { to: '/watering-heads', label: 'Heads', icon: Droplets },
]

export default function Nav() {
  return (
    <>
      {/* ── Desktop top nav (md and up) ─────────────────────────────── */}
      <nav className="hidden md:block bg-blue-950 text-white shadow-md flex-shrink-0">
        <div className="px-2">
          <div className="flex items-center h-12 gap-1">
            <span className="text-sm font-bold whitespace-nowrap mr-3 text-blue-300 flex items-center gap-1.5">
              <Droplets size={16} className="text-blue-400" />
              Irrigation
            </span>
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors
                  ${isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-blue-300 hover:bg-blue-800 hover:text-white'}`
                }
              >
                <Icon size={13} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Mobile top bar (below md) ────────────────────────────────── */}
      <div className="md:hidden bg-blue-950 text-white flex-shrink-0 flex items-center h-11 px-4 shadow-md">
        <Droplets size={16} className="text-blue-400 mr-2" />
        <span className="text-sm font-bold text-blue-300">Irrigation</span>
      </div>

      {/* ── Mobile bottom tab bar (below md) ────────────────────────── */}
      {/* Rendered outside normal flow via fixed positioning */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-[2000] bg-blue-950 border-t border-blue-800 flex items-stretch safe-area-pb">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors
              ${isActive
                ? 'text-white bg-blue-700'
                : 'text-blue-400 hover:text-white'}`
            }
          >
            <Icon size={20} />
            <span className="leading-tight">{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
