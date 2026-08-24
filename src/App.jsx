import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Collection from './pages/Collection';
import Product from './pages/Product';
import Admin from './pages/Admin';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/collection.html" element={<Collection />} />
      <Route path="/product.html" element={<Product />} />
      <Route path="/admin.html" element={<Admin />} />
    </Routes>
  );
}
