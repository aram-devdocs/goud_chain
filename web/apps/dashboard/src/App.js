import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth, useToast } from '@workspace/hooks';
import { Header, Navigation, Toast } from '@workspace/ui';
import AuthPage from './pages/auth';
import DashboardPage from './pages/dashboard';
import SubmitPage from './pages/submit';
import CollectionsPage from './pages/collections';
import ExplorerPage from './pages/explorer';
import NetworkPage from './pages/network';
import AnalyticsPage from './pages/analytics';
import AuditPage from './pages/audit';
import MetricsPage from './pages/metrics';
import DebugPage from './pages/debug';
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});
const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'submit', label: 'Submit Data' },
    { id: 'collections', label: 'Collections' },
    { id: 'explorer', label: 'Blockchain' },
    { id: 'network', label: 'Network' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'audit', label: 'Audit Logs' },
    { id: 'metrics', label: 'Metrics' },
    { id: 'debug', label: 'Debug' },
];
function AppContent() {
    const { isAuthenticated, logout } = useAuth();
    const { toasts, dismiss } = useToast();
    const [activeView, setActiveView] = useState('dashboard');
    if (!isAuthenticated) {
        return _jsx(AuthPage, {});
    }
    const renderPage = () => {
        switch (activeView) {
            case 'dashboard':
                return _jsx(DashboardPage, {});
            case 'submit':
                return _jsx(SubmitPage, {});
            case 'collections':
                return _jsx(CollectionsPage, {});
            case 'explorer':
                return _jsx(ExplorerPage, {});
            case 'network':
                return _jsx(NetworkPage, {});
            case 'analytics':
                return _jsx(AnalyticsPage, {});
            case 'audit':
                return _jsx(AuditPage, {});
            case 'metrics':
                return _jsx(MetricsPage, {});
            case 'debug':
                return _jsx(DebugPage, {});
            default:
                return _jsx(DashboardPage, {});
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-black", children: [_jsx("div", { className: "fixed top-4 right-4 z-50 space-y-2 max-w-md", children: toasts.map((toast) => (_jsx(Toast, { type: toast.type, message: toast.message, onDismiss: () => dismiss(toast.id) }, toast.id))) }), _jsx(Header, { title: "Goud Chain", subtitle: "Encrypted Blockchain Platform", children: _jsx("button", { onClick: logout, className: "text-sm text-zinc-400 hover:text-white transition-colors", children: "Logout" }) }), _jsx(Navigation, { items: navItems, activeId: activeView, onNavigate: setActiveView }), _jsx("main", { className: "container mx-auto px-6 py-8", children: renderPage() })] }));
}
export default function App() {
    return (_jsx(QueryClientProvider, { client: queryClient, children: _jsx(AppContent, {}) }));
}
//# sourceMappingURL=App.js.map