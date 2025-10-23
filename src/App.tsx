import { sdk } from "@farcaster/frame-sdk";
import { useEffect } from "react";
import { ThirdwebProvider } from "thirdweb/react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { 
  NotificationProvider, 
  TransactionPopupProvider 
} from "@blockscout/app-sdk";

import PyQuestHome from "./components/pyquest/PyQuestHome";
import CreateBounty from "./components/pyquest/CreateBounty";
import MyBounties from "./components/pyquest/MyBounties";
import Leaderboard from "./components/pyquest/Leaderboard";

function App() {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return (
    <NotificationProvider>
      <TransactionPopupProvider>
        <ThirdwebProvider>
          <BrowserRouter>
            <div className="w-full min-h-screen flex flex-col">
              <Routes>
                <Route path="/" element={<PyQuestHome />} />
                <Route path="/bounty" element={<CreateBounty />} />
                <Route path="/my-bounties" element={<MyBounties />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
              </Routes>
            </div>
          </BrowserRouter>
        </ThirdwebProvider>
      </TransactionPopupProvider>
    </NotificationProvider>
  );
}

export default App;