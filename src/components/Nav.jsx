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
    <nav className="bg-blue-950 text-white shadow-md flex-shrink-0">
      <div className="px-2">
        <div className="flex items-center h-12 gap-1 overflow-x-auto scrollbar-hide">
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
  )
}
