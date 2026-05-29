import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Briefcase, Users, FileText, Calendar,
  Settings, LogOut, Zap, ChevronRight, Kanban, Star
} from 'lucide-react';

const NAV_BY_ROLE = {
  admin: [
    { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/app/jobs', icon: Briefcase, label: 'Jobs' },
    { to: '/app/candidates', icon: Users, label: 'Candidates' },
    { to: '/app/applications', icon: FileText, label: 'Applications' },
    { to: '/app/pipeline', icon: Kanban, label: 'Pipeline' },
    { to: '/app/shortlist', icon: Star, label: 'Smart Shortlist' },
    { to: '/app/interviews', icon: Calendar, label: 'Interviews' },
  ],
  recruiter: [
    { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/app/jobs', icon: Briefcase, label: 'Jobs' },
    { to: '/app/candidates', icon: Users, label: 'Candidates' },
    { to: '/app/applications', icon: FileText, label: 'Applications' },
    { to: '/app/pipeline', icon: Kanban, label: 'Pipeline' },
    { to: '/app/shortlist', icon: Star, label: 'Smart Shortlist' },
    { to: '/app/interviews', icon: Calendar, label: 'Interviews' },
  ],
  hiring_manager: [
    { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/app/jobs', icon: Briefcase, label: 'Jobs' },
    { to: '/app/applications', icon: FileText, label: 'Applications' },
    { to: '/app/pipeline', icon: Kanban, label: 'Pipeline' },
    { to: '/app/interviews', icon: Calendar, label: 'Interviews' },
  ],
};

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleColors = {
    admin: 'bg-red-100 text-red-700',
    recruiter: 'bg-indigo-100 text-indigo-700',
    hiring_manager: 'bg-emerald-100 text-emerald-700',
  };

  const navItems = NAV_BY_ROLE[user?.role] || NAV_BY_ROLE.recruiter;

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={onClose} />}

      <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-30 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">TalentFlow AI</p>
            <p className="text-xs text-gray-500">Smart ATS Suite</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                  {label}
                  {isActive && <ChevronRight className="w-3 h-3 ml-auto text-indigo-400" />}
                </>
              )}
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <NavLink
              to="/app/settings"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Settings className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                  Settings
                </>
              )}
            </NavLink>
          )}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${roleColors[user?.role] || 'bg-gray-100 text-gray-600'}`}>
                {user?.role?.replace('_', ' ')}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
