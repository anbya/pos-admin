import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/navigation/Sidebar';
import Navbar from '../components/navigation/Navbar';
import { useAuth } from '../contexts/AuthContext';
const MainLayout = () => {
  const {
    isAuthenticated,
    isLoading
  } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>;
  }
  if (!isAuthenticated) {
    return null; // Will redirect in the useEffect
  }
  return <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto py-4 sm:py-6 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>;
};
export default MainLayout;