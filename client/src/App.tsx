import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import { SettingsProvider } from "./lib/settings";
import Home from "@/pages/home";
import Admin from "@/pages/admin-new";
import NotFound from "@/pages/not-found";
import Promo from "@/pages/promo";
import Tentang from "@/pages/tentang";
import OrderHistory from "@/pages/order-history";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/promo" component={Promo} />
      <Route path="/tentang" component={Tentang} />
      <Route path="/admin" component={Admin} />
      <Route path="/order-history" component={OrderHistory} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <TooltipProvider>
          <AuthProvider>
            <CartProvider>
              <Toaster />
              <Router />
            </CartProvider>
          </AuthProvider>
        </TooltipProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}

export default App;
