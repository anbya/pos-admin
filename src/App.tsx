import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from './layouts/MainLayout';
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProductCategories from "./pages/ProductCategories";
import Items from "./pages/Items";
import Products from "./pages/Products";
import Promos from "./pages/Promos";
import AIAssistant from "./pages/AIAssistant";
import "./App.css";
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="product-categories" element={<ProductCategories />} />
            <Route path="items" element={<Items />} />
            <Route path="products" element={<Products />} />
            <Route path="promos" element={<Promos />} />
            <Route path="ai-assistant" element={<AIAssistant />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
