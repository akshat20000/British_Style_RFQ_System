import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RFQList from './pages/RFQList';
import CreateRFQ from './pages/createRFQ';
import AuctionDetails from './pages/AuctionDetails';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RFQList />} />
        <Route path="/create" element={<CreateRFQ />} />
        <Route path="/rfqs/:id" element={<AuctionDetails />} />
      </Routes>
    </BrowserRouter>
  );
}