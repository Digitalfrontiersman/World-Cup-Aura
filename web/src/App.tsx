import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/routes/not-found";
import Home from "@/routes/Home";
import CardPreview from "@/routes/CardPreview";
import Docs from "@/routes/Docs";
import Collection from "@/routes/Collection";
import Odds from "@/routes/Odds";

const queryClient = new QueryClient();

/** Reset scroll to the top on every route change (SPA nav doesn't do this). */
function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/collection" component={Collection} />
      <Route path="/odds" component={Odds} />
      <Route path="/card/:slug" component={CardPreview} />
      <Route path="/docs" component={Docs} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ScrollToTop />
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
