import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { LangProvider } from "@/contexts/LangContext";
import { UpgradeModal } from "@/components/premium/UpgradeModal";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LangProvider>
      <SubscriptionProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 antialiased">
              <Switch>
                <Route path="/" component={Home} />
                <Route component={NotFound} />
              </Switch>
            </div>
          </WouterRouter>
          {/* Global upgrade modal — can be opened from any component */}
          <UpgradeModal />
          <Toaster />
        </TooltipProvider>
      </SubscriptionProvider>
      </LangProvider>
    </QueryClientProvider>
  );
}

export default App;
