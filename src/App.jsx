import { Toaster } from "@/components/ui/toaster"
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import ScrollToTop from './components/ScrollToTop';
import Home from '@/pages/Home';
import Game from '@/pages/Game';
import LogicGame from '@/pages/LogicGame';
import Achievements from '@/pages/Achievements';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game/:level" element={<Game />} />
        <Route path="/logic" element={<LogicGame />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
      <Toaster />
    </Router>
  )
}

export default App
