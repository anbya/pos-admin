import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboardIcon,
  LogOutIcon,
  BarChartIcon,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

type NavigationItem = {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: number;
};

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboardIcon },
  // { name: 'Employees', href: '/employees', icon: UserIcon },
  // { name: 'Departments', href: '/departments', icon: BarChartIcon },
  { name: 'Items', href: '/items', icon: BarChartIcon },
  { name: 'Product Categories', href: '/product-categories', icon: BarChartIcon },
  { name: 'Products', href: '/products', icon: BarChartIcon },
  { name: 'Promos', href: '/promos', icon: BarChartIcon },
  // { name: 'AI Assistant', href: '/ai-assistant', icon: BarChartIcon },
  // { name: 'Positions', href: '/positions', icon: BriefcaseIcon },
  // { name: 'Work Schedules', href: '/work-schedules', icon: ClockIcon },
  // { name: 'Leave Types', href: '/leave-types', icon: CalendarIcon },
  // { name: 'Leaves', href: '/leaves', icon: CalendarIcon },
  // { name: 'Attendance', href: '/attendance-summary', icon: CalendarIcon },
  // { name: 'Attendance Penalties', href: '/attendance-penalties', icon: ClockIcon },
  // { name: 'Payroll', href: '/payroll', icon: DownloadIcon },
  // { name: 'Self Check-in', href: '/self-checkin', icon: ClockIcon },
  // { name: 'Inbox', href: '/inbox', icon: MailIcon, badge: 23 },
  // { name: 'Statistics', href: '/statistics', icon: BarChartIcon }
];

const Sidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 w-64">
      <div className="p-6">
        <div className="flex items-center">
          <div className="h-9 w-12 rounded-md bg-[#009FC3] flex items-center justify-center text-white font-bold text-xl">
            POS
          </div>
          <span className="ml-3 text-2xl font-bold text-gray-900 tracking-tight">
            Admin
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <nav className="space-y-1">
          {navigation.map(item => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex items-center px-4 py-2 transition-colors
                  ${active
                    ? 'text-[#009FC3] font-semibold border-l-4 border-[#009FC3] bg-[#F5FBFD]'
                    : 'text-gray-500 hover:bg-gray-50'}
                `}
                style={{ fontWeight: active ? 600 : 400 }}
              >
                <Icon className={`mr-3 h-5 w-5 ${active ? 'text-[#009FC3]' : 'text-gray-400'}`} />
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <span className="ml-2 bg-[#009FC3] text-white text-xs rounded-full px-2 py-0.5">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-6 border-t border-gray-200">
        <button
          onClick={logout}
          className="flex items-center px-4 py-2 text-base font-semibold text-gray-700 rounded-lg hover:bg-gray-100 w-full transition"
        >
          <LogOutIcon className="mr-3 h-5 w-5 flex-shrink-0 text-[#009FC3]" />
          Sign out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;