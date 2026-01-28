import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth-context";
import { ProtectedRoute, AdminRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import AuthPage from "@/pages/auth";
import DashboardPage from "@/pages/dashboard/index";
import DepositPage from "@/pages/dashboard/deposit";
import WithdrawPage from "@/pages/dashboard/withdraw";
import PaymentLinksPage from "@/pages/dashboard/payment-links";
import CreatePaymentLinkPage from "@/pages/dashboard/create-payment-link";
import EditPaymentLinkPage from "@/pages/dashboard/edit-payment-link";
import HistoryPage from "@/pages/dashboard/history";
import KycPage from "@/pages/dashboard/kyc";
import ApiKeysPage from "@/pages/dashboard/api-keys";
import SettingsPage from "@/pages/dashboard/settings";
import DashboardHelpPage from "@/pages/dashboard/help";
import ApiDocsPage from "@/pages/api-docs";
import PaymentPage from "@/pages/pay";
import SuccessPage from "@/pages/success";
import PaymentSuccessPage from "@/pages/payment-success";
import AdminDashboardPage from "@/pages/admin/index";
import TermsPage from "@/pages/terms";
import AboutPage from "@/pages/about";
import HelpPage from "@/pages/help";
import MerchantAuth from "@/pages/merchant/auth";
import MerchantDashboard from "@/pages/merchant/dashboard";
import DocsPage from "@/pages/docs";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/api-docs" component={ApiDocsPage} />
      <Route path="/pay/:code" component={PaymentPage} />
      <Route path="/success" component={SuccessPage} />
      <Route path="/payment-success" component={PaymentSuccessPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/help" component={HelpPage} />
      <Route path="/docs" component={DocsPage} />
      <Route path="/merchant" component={MerchantAuth} />
      <Route path="/merchant/dashboard" component={MerchantDashboard} />
      
      <ProtectedRoute path="/dashboard" component={DashboardPage} />
      <ProtectedRoute path="/dashboard/deposit" component={DepositPage} />
      <ProtectedRoute path="/dashboard/withdraw" component={WithdrawPage} />
            <ProtectedRoute path="/dashboard/payment-links" component={PaymentLinksPage} />
      <ProtectedRoute path="/dashboard/payment-links/create" component={CreatePaymentLinkPage} />
      <ProtectedRoute path="/dashboard/payment-links/edit/:id" component={EditPaymentLinkPage} />
      <ProtectedRoute path="/dashboard/history" component={HistoryPage} />
      <ProtectedRoute path="/dashboard/kyc" component={KycPage} />
      <ProtectedRoute path="/dashboard/api-keys" component={ApiKeysPage} />
      <ProtectedRoute path="/dashboard/help" component={DashboardHelpPage} />
      <ProtectedRoute path="/dashboard/settings" component={SettingsPage} />
      
      <AdminRoute path="/admin" component={AdminDashboardPage} />
      <AdminRoute path="/admin/users" component={AdminDashboardPage} />
      <AdminRoute path="/admin/transactions" component={AdminDashboardPage} />
      <AdminRoute path="/admin/withdrawals" component={AdminDashboardPage} />
      <AdminRoute path="/admin/kyc" component={AdminDashboardPage} />
      <AdminRoute path="/admin/api-keys" component={AdminDashboardPage} />
      <AdminRoute path="/admin/commissions" component={AdminDashboardPage} />
      <AdminRoute path="/admin/withdrawal-numbers" component={AdminDashboardPage} />
      <AdminRoute path="/admin/countries" component={AdminDashboardPage} />
      <AdminRoute path="/admin/operators" component={AdminDashboardPage} />
      <AdminRoute path="/admin/payment-links" component={AdminDashboardPage} />
      <AdminRoute path="/admin/messaging" component={AdminDashboardPage} />
      <AdminRoute path="/admin/logs" component={AdminDashboardPage} />
      <AdminRoute path="/admin/reports" component={AdminDashboardPage} />
      <AdminRoute path="/admin/settings" component={AdminDashboardPage} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
