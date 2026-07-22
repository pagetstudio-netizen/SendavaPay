import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth-context";
import { ProtectedRoute, AdminRoute } from "@/lib/protected-route";
import { ADMIN_PATH } from "@/lib/admin-path";
import { lazy, Suspense } from "react";

const NotFound = lazy(() => import("@/pages/not-found"));
const HomePage = lazy(() => import("@/pages/home"));
const AuthPage = lazy(() => import("@/pages/auth"));
const PartnerLoginPage = lazy(() => import("@/pages/partner/login"));
const PartnerDashboardPage = lazy(() => import("@/pages/partner/dashboard"));
const PartnerPublicPage = lazy(() => import("@/pages/partner-public"));
const DashboardPage = lazy(() => import("@/pages/dashboard/index"));
const DepositPage = lazy(() => import("@/pages/dashboard/deposit"));
const WithdrawPage = lazy(() => import("@/pages/dashboard/withdraw"));
const PaymentLinksPage = lazy(() => import("@/pages/dashboard/payment-links"));
const CreatePaymentLinkPage = lazy(() => import("@/pages/dashboard/create-payment-link"));
const EditPaymentLinkPage = lazy(() => import("@/pages/dashboard/edit-payment-link"));
const HistoryPage = lazy(() => import("@/pages/dashboard/history"));
const KycPage = lazy(() => import("@/pages/dashboard/kyc"));
const ApiKeysPage = lazy(() => import("@/pages/dashboard/api-keys"));
const SettingsPage = lazy(() => import("@/pages/dashboard/settings"));
const DashboardHelpPage = lazy(() => import("@/pages/dashboard/help"));
const WalletsPage = lazy(() => import("@/pages/dashboard/wallets"));
const PaymentPage = lazy(() => import("@/pages/pay"));
const PayApiPage = lazy(() => import("@/pages/pay-api"));

const SuccessPage = lazy(() => import("@/pages/success"));
const PaymentSuccessPage = lazy(() => import("@/pages/payment-success"));
const SdkPaymentResultPage = lazy(() => import("@/pages/sdk-payment-result"));
const AdminDashboardPage = lazy(() => import("@/pages/admin/index"));
const AdminSecurityPage = lazy(() => import("@/pages/admin/security"));
const AdminSdkWithdrawalLogsPage = lazy(() => import("@/pages/admin/sdk-withdrawal-logs"));
const AdminBlacklistPage = lazy(() => import("@/pages/admin/blacklist"));
const AdminKycManagementPage = lazy(() => import("@/pages/admin/kyc-management"));
const TermsPage = lazy(() => import("@/pages/terms"));
const AboutPage = lazy(() => import("@/pages/about"));
const HelpPage = lazy(() => import("@/pages/help"));
const DocsPage = lazy(() => import("@/pages/docs"));
const StatistiquesPage = lazy(() => import("@/pages/statistiques"));
const LiensPaiementPage = lazy(() => import("@/pages/liens-paiement"));
const AssistancePage = lazy(() => import("@/pages/assistance"));
const ApiPaiementPage = lazy(() => import("@/pages/api-paiement"));
const SdkDocsPage = lazy(() => import("@/pages/sdk-docs"));
const DocumentationPage = lazy(() => import("@/pages/documentation"));
const ForgotPasswordPage = lazy(() => import("@/pages/forgot-password"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/partner/login" component={PartnerLoginPage} />
        <Route path="/partner/dashboard" component={PartnerDashboardPage} />
        <Route path="/partner.by_:slug" component={PartnerPublicPage} />
        <Route path="/pay/api/:reference" component={PayApiPage} />
        <Route path="/pay/:code" component={PaymentPage} />
        <Route path="/success" component={SuccessPage} />
        <Route path="/sdk-payment-result" component={SdkPaymentResultPage} />
        <Route path="/payment-success" component={PaymentSuccessPage} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/help" component={HelpPage} />
        <Route path="/docs" component={DocsPage} />
        <Route path="/statistiques" component={StatistiquesPage} />
        <Route path="/liens-de-paiement" component={LiensPaiementPage} />
        <Route path="/assistance" component={AssistancePage} />
        <Route path="/api-de-paiement" component={ApiPaiementPage} />
        <Route path="/sdk-docs" component={SdkDocsPage} />
        <Route path="/documentation" component={DocumentationPage} />
        <Route path="/forgot-password" component={ForgotPasswordPage} />

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
        <ProtectedRoute path="/dashboard/wallets" component={WalletsPage} />

        <AdminRoute path={ADMIN_PATH} component={AdminDashboardPage} />
        <AdminRoute path={`${ADMIN_PATH}/users`} component={AdminDashboardPage} />
        <AdminRoute path={`${ADMIN_PATH}/transactions`} component={AdminDashboardPage} />
        <AdminRoute path={`${ADMIN_PATH}/withdrawals`} component={AdminDashboardPage} />
        <AdminRoute path={`${ADMIN_PATH}/kyc`} component={AdminDashboardPage} />
        <AdminRoute path={`${ADMIN_PATH}/api-keys`} component={AdminDashboardPage} />
        <AdminRoute path={`${ADMIN_PATH}/commissions`} component={AdminDashboardPage} />
        <AdminRoute path={`${ADMIN_PATH}/withdrawal-numbers`} component={AdminDashboardPage} />
        <AdminRoute path={`${ADMIN_PATH}/countries`} component={AdminDashboardPage} />
        <AdminRoute path={`${ADMIN_PATH}/operators`} component={AdminDashboardPage} />
        <AdminRoute path={`${ADMIN_PATH}/payment-links`} component={AdminDashboardPage} />
        <AdminRoute path={`${ADMIN_PATH}/messaging`} component={AdminDashboardPage} />
        <AdminRoute path={`${ADMIN_PATH}/email-broadcast`} component={AdminDashboardPage} />
        <AdminRoute path={`${ADMIN_PATH}/logs`} component={AdminDashboardPage} />
        <AdminRoute path={`${ADMIN_PATH}/reports`} component={AdminDashboardPage} />
        <AdminRoute path={`${ADMIN_PATH}/partners`} component={AdminDashboardPage} />
        <AdminRoute path={`${ADMIN_PATH}/wallet-exchanges`} component={AdminDashboardPage} />
        <AdminRoute path={`${ADMIN_PATH}/settings`} component={AdminDashboardPage} />
        <AdminRoute path={`${ADMIN_PATH}/security`} component={AdminSecurityPage} />
        <AdminRoute path={`${ADMIN_PATH}/sdk-withdrawal-logs`} component={AdminSdkWithdrawalLogsPage} />
        <AdminRoute path={`${ADMIN_PATH}/blacklist`} component={AdminBlacklistPage} />
        <AdminRoute path={`${ADMIN_PATH}/kyc-management`} component={AdminKycManagementPage} />

        <Route component={NotFound} />
      </Switch>
    </Suspense>
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
