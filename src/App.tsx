import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from 'sonner'
import { WalletContextProvider } from "@/contexts/WalletContext";
import Home from "@/pages/Home";
import Editor from "@/pages/Editor";
import Lore from "@/pages/Lore";
import { VWall } from "@/pages/VWall";


export default function App() {
  return (
    <>
      <WalletContextProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/editor" element={<Editor />} />
            <Route path="/vwall" element={<VWall />} />
            <Route path="/lore" element={<Lore />} />
          </Routes>
        </Router>
      </WalletContextProvider>
      <Toaster 
        position="top-right" 
        richColors 
        closeButton
        toastOptions={{
          duration: 4000,
        }}
      />
    </>
  );
}
