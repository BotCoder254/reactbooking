import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaHome, 
  FaPlane, 
  FaUser, 
  FaHistory, 
  FaChartBar,
  FaBars,
  FaTimes,
  FaTicketAlt,
  FaSearch,
  FaSignOutAlt,
  FaUsers,
  FaCog,
  FaBookmark,
  FaBell
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < 1024);
  const location = useLocation();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const handleResize = () => {
      setIsCollapsed(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const userMenuItems = [
    { path: '/dashboard', icon: <FaHome />, label: 'Dashboard' },
    { path: '/flights', icon: <FaPlane />, label: 'All Flights' },
    { path: '/bookings', icon: <FaTicketAlt />, label: 'My Bookings' },
    { path: '/saved', icon: <FaBookmark />, label: 'Saved Flights' },
    { path: '/profile', icon: <FaUser />, label: 'Profile' },
  ];

  const adminMenuItems = [
    { path: '/admin', icon: <FaChartBar />, label: 'Dashboard' },
    { path: '/admin/flights', icon: <FaPlane />, label: 'Manage Flights' },
    { path: '/admin/bookings', icon: <FaTicketAlt />, label: 'All Bookings' },
    { path: '/admin/users', icon: <FaUsers />, label: 'User Management' },
  ];

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const sidebarVariants = {
    expanded: {
      width: '280px',
      transition: {
        duration: 0.3,
      },
    },
    collapsed: {
      width: '80px',
      transition: {
        duration: 0.3,
      },
    },
  };

  return (
    <>
      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
    <motion.div
        variants={sidebarVariants}
      animate={isCollapsed ? 'collapsed' : 'expanded'}
        className={`fixed left-0 top-0 h-full bg-white shadow-lg z-30 overflow-hidden flex flex-col
          ${isCollapsed ? 'w-20' : 'w-[280px]'}`}
    >
      {/* Toggle Button */}
      <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100"
      >
          {isCollapsed ? <FaBars /> : <FaTimes />}
      </button>

        {/* Logo */}
        <div className="flex items-center h-16 px-6">
        <img
          src="/logo.png"
            alt="FlySavvy"
            className="h-8 w-8"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/32';
            }}
        />
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="ml-3 font-bold text-xl text-primary"
            >
              FlySavvy
            </motion.span>
          )}
      </div>

      {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center h-12 px-6 text-gray-600 hover:bg-primary hover:bg-opacity-10 hover:text-primary transition-colors
                  ${location.pathname === item.path ? 'bg-primary bg-opacity-10 text-primary' : ''}`}
              >
                <span className="text-xl">{item.icon}</span>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="ml-4"
                  >
                    {item.label}
                  </motion.span>
                )}
              </Link>
            ))}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center h-12 px-6 text-red-600 hover:bg-red-50 transition-colors border-t border-gray-200 mt-auto"
          >
            <span className="text-xl">
              <FaSignOutAlt />
            </span>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="ml-4 font-medium"
              >
                Logout
              </motion.span>
            )}
          </button>
        </nav>
    </motion.div>

      {/* Main Content Margin */}
      <div className={`${isCollapsed ? 'ml-20' : 'ml-[280px]'} transition-all duration-300`} />
    </>
  );
};

export default Sidebar;
