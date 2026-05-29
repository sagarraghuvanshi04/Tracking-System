import { useState, useRef, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton, Avatar,
  List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Divider, Badge, Popover, Tooltip, Chip, Stack, Paper,
  useMediaQuery, useTheme,
} from '@mui/material';
import {
  Dashboard, Work, People, Description, ViewKanban, Star,
  CalendarMonth, Settings, Logout, Menu as MenuIcon,
  Notifications, BoltRounded, CheckCircle, Close, DoneAll,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import useNotifications from '../../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { NavLink } from 'react-router-dom';

const DRAWER_WIDTH = 260;

const NAV_BY_ROLE = {
  admin: [
    { to: '/app/dashboard', icon: Dashboard, label: 'Dashboard' },
    { to: '/app/jobs', icon: Work, label: 'Jobs' },
    { to: '/app/candidates', icon: People, label: 'Candidates' },
    { to: '/app/applications', icon: Description, label: 'Applications' },
    { to: '/app/pipeline', icon: ViewKanban, label: 'Pipeline' },
    { to: '/app/shortlist', icon: Star, label: 'Smart Shortlist' },
    { to: '/app/interviews', icon: CalendarMonth, label: 'Interviews' },
  ],
  recruiter: [
    { to: '/app/dashboard', icon: Dashboard, label: 'Dashboard' },
    { to: '/app/jobs', icon: Work, label: 'Jobs' },
    { to: '/app/candidates', icon: People, label: 'Candidates' },
    { to: '/app/applications', icon: Description, label: 'Applications' },
    { to: '/app/pipeline', icon: ViewKanban, label: 'Pipeline' },
    { to: '/app/shortlist', icon: Star, label: 'Smart Shortlist' },
    { to: '/app/interviews', icon: CalendarMonth, label: 'Interviews' },
  ],
  hiring_manager: [
    { to: '/app/dashboard', icon: Dashboard, label: 'Dashboard' },
    { to: '/app/jobs', icon: Work, label: 'Jobs' },
    { to: '/app/applications', icon: Description, label: 'Applications' },
    { to: '/app/pipeline', icon: ViewKanban, label: 'Pipeline' },
    { to: '/app/interviews', icon: CalendarMonth, label: 'Interviews' },
  ],
};

const roleChipColor = { admin: 'error', recruiter: 'primary', hiring_manager: 'success' };

const pageTitles = {
  '/app/dashboard': 'Dashboard',
  '/app/jobs': 'Job Postings',
  '/app/candidates': 'Candidates',
  '/app/applications': 'Applications',
  '/app/pipeline': 'Pipeline',
  '/app/shortlist': 'Smart Shortlist',
  '/app/interviews': 'Interviews',
  '/app/settings': 'Settings',
  '/app/profile': 'My Profile',
};

function SidebarContent({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = NAV_BY_ROLE[user?.role] || NAV_BY_ROLE.recruiter;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#1a1a2e' }}>
      {/* Logo */}
      <Box sx={{ px: 3, py: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: 2,
          background: 'linear-gradient(135deg, #e94560, #c73652)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <BoltRounded sx={{ color: '#fff', fontSize: 20 }} />
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
            TalentFlow
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>
            AI · Premium Suite
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* Nav */}
      <List sx={{ flex: 1, px: 1.5, py: 2 }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <ListItem key={to} disablePadding sx={{ mb: 0.5 }}>
            <NavLink to={to} onClick={onClose} style={{ width: '100%', textDecoration: 'none' }}>
              {({ isActive }) => (
                <ListItemButton
                  sx={{
                    borderRadius: 2,
                    py: 1.2,
                    bgcolor: isActive ? 'rgba(233,69,96,0.15)' : 'transparent',
                    '&:hover': { bgcolor: isActive ? 'rgba(233,69,96,0.2)' : 'rgba(255,255,255,0.06)' },
                    borderLeft: isActive ? '3px solid #e94560' : '3px solid transparent',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Icon sx={{ fontSize: 18, color: isActive ? '#e94560' : 'rgba(255,255,255,0.45)' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={label}
                    primaryTypographyProps={{
                      fontSize: '0.85rem',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                    }}
                  />
                </ListItemButton>
              )}
            </NavLink>
          </ListItem>
        ))}

        {user?.role === 'admin' && (
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <NavLink to="/app/settings" onClick={onClose} style={{ width: '100%', textDecoration: 'none' }}>
              {({ isActive }) => (
                <ListItemButton
                  sx={{
                    borderRadius: 2, py: 1.2,
                    bgcolor: isActive ? 'rgba(233,69,96,0.15)' : 'transparent',
                    '&:hover': { bgcolor: isActive ? 'rgba(233,69,96,0.2)' : 'rgba(255,255,255,0.06)' },
                    borderLeft: isActive ? '3px solid #e94560' : '3px solid transparent',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Settings sx={{ fontSize: 18, color: isActive ? '#e94560' : 'rgba(255,255,255,0.45)' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Settings"
                    primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: isActive ? 600 : 400, color: isActive ? '#fff' : 'rgba(255,255,255,0.55)' }}
                  />
                </ListItemButton>
              )}
            </NavLink>
          </ListItem>
        )}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* User */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)', mb: 1 }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: '#e94560', fontSize: '0.85rem', fontWeight: 700 }}>
            {user?.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, fontSize: '0.8rem' }} noWrap>
              {user?.name}
            </Typography>
            <Chip
              label={user?.role?.replace('_', ' ')}
              size="small"
              color={roleChipColor[user?.role] || 'default'}
              sx={{ height: 16, fontSize: '0.6rem', mt: 0.3 }}
            />
          </Box>
        </Box>
        <ListItemButton
          onClick={handleLogout}
          sx={{ borderRadius: 2, py: 1, '&:hover': { bgcolor: 'rgba(233,69,96,0.15)' } }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <Logout sx={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }} />
          </ListItemIcon>
          <ListItemText primary="Sign Out" primaryTypographyProps={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }} />
        </ListItemButton>
      </Box>
    </Box>
  );
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('lg'));
  const { notifications, unreadCount, markRead, markAllRead, remove } = useNotifications();

  const title = Object.entries(pageTitles).find(([p]) => location.pathname.startsWith(p))?.[1] || 'TalentFlow AI';

  const handleNotifClick = (n) => {
    if (!n.read) markRead(n._id);
    if (n.link) navigate(n.link);
    setNotifAnchor(null);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f0f2f5' }}>
      {/* Desktop Drawer */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', border: 'none', boxShadow: '4px 0 24px rgba(0,0,0,0.08)' },
          }}
        >
          <SidebarContent onClose={() => {}} />
        </Drawer>
      )}

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none' },
        }}
      >
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </Drawer>

      {/* Main */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: '#fff',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            color: 'text.primary',
          }}
        >
          <Toolbar sx={{ gap: 2, minHeight: '64px !important' }}>
            {isMobile && (
              <IconButton onClick={() => setMobileOpen(true)} size="small">
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', flex: 1 }}>
              {title}
            </Typography>

            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton onClick={(e) => setNotifAnchor(e.currentTarget)} size="small">
                <Badge badgeContent={unreadCount} color="error" max={9}>
                  <Notifications sx={{ fontSize: 20, color: '#64748b' }} />
                </Badge>
              </IconButton>
            </Tooltip>

            <Popover
              open={Boolean(notifAnchor)}
              anchorEl={notifAnchor}
              onClose={() => setNotifAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{ sx: { width: 340, borderRadius: 3, mt: 1, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' } }}
            >
              <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  Notifications {unreadCount > 0 && <Box component="span" sx={{ color: '#e94560' }}>({unreadCount})</Box>}
                </Typography>
                {unreadCount > 0 && (
                  <Tooltip title="Mark all read">
                    <IconButton size="small" onClick={markAllRead}>
                      <DoneAll sx={{ fontSize: 16, color: '#e94560' }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              <Box sx={{ maxHeight: 320, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <Box sx={{ py: 5, textAlign: 'center' }}>
                    <CheckCircle sx={{ fontSize: 32, color: '#e2e8f0', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">All caught up!</Typography>
                  </Box>
                ) : (
                  notifications.map((n) => (
                    <Box
                      key={n._id}
                      onClick={() => handleNotifClick(n)}
                      sx={{
                        px: 2, py: 1.5, cursor: 'pointer', display: 'flex', gap: 1.5, alignItems: 'flex-start',
                        bgcolor: !n.read ? 'rgba(233,69,96,0.04)' : 'transparent',
                        borderBottom: '1px solid rgba(0,0,0,0.04)',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' },
                      }}
                    >
                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: !n.read ? '#e94560' : 'transparent', mt: 0.8, flexShrink: 0 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="caption" fontWeight={600} display="block" noWrap>{n.title}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.3, lineHeight: 1.4 }}>{n.message}</Typography>
                        <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', mt: 0.5 }}>
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </Typography>
                      </Box>
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); remove(n._id); }} sx={{ mt: -0.5 }}>
                        <Close sx={{ fontSize: 13, color: '#cbd5e1' }} />
                      </IconButton>
                    </Box>
                  ))
                )}
              </Box>
            </Popover>

            {/* Profile */}
            <Tooltip title="My Profile">
              <Avatar
                onClick={() => navigate('/app/profile')}
                sx={{ width: 34, height: 34, bgcolor: '#e94560', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', '&:hover': { bgcolor: '#c73652' } }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
            </Tooltip>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
