import { Routes, Route } from "react-router-dom";
import Nav from "./components/Nav";
import { ToastProvider } from "./components/Toast";
import Landing from "./pages/Landing";
import Marketplace from "./pages/Marketplace";
import Upload from "./pages/Upload";
import CreatorProfile from "./pages/CreatorProfile";

export default function App() {
  return (
    <ToastProvider>
      <Nav />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/browse" element={<Marketplace />} />
        <Route path="/sell" element={<Upload />} />
        <Route path="/creator/:address" element={<CreatorProfile />} />
      </Routes>
    </ToastProvider>
  );
}
