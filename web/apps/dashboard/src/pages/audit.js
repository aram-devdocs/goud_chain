import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useAuditLogs } from '@goudchain/hooks';
import { Card, CardHeader, CardTitle, CardContent, Spinner } from '@goudchain/ui';
import { formatDate, formatHash } from '@goudchain/utils';
import { SpinnerSize } from '@goudchain/types';
export default function AuditPage() {
    const [limit] = useState(50);
    const { data, isLoading } = useAuditLogs({ limit });
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx(Spinner, { size: SpinnerSize.Large }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-3xl font-bold text-white mb-2", children: "Audit Logs" }), _jsx("p", { className: "text-zinc-500", children: "Security audit trail and activity logs" })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Recent Activity" }) }), _jsx(CardContent, { children: data?.logs.length === 0 ? (_jsx("p", { className: "text-zinc-500 text-center py-8", children: "No audit logs yet" })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-zinc-800", children: [_jsx("th", { className: "text-left py-3 px-4 text-zinc-400 font-medium", children: "Event Type" }), _jsx("th", { className: "text-left py-3 px-4 text-zinc-400 font-medium", children: "Timestamp" }), _jsx("th", { className: "text-left py-3 px-4 text-zinc-400 font-medium", children: "IP Hash" }), _jsx("th", { className: "text-left py-3 px-4 text-zinc-400 font-medium", children: "Event ID" })] }) }), _jsx("tbody", { children: data?.logs.map((log, index) => (_jsxs("tr", { className: index % 2 === 0 ? 'bg-zinc-950' : 'bg-zinc-900/50', children: [_jsx("td", { className: "py-3 px-4 font-mono text-white", children: log.event_type }), _jsx("td", { className: "py-3 px-4 font-mono text-zinc-400 text-xs", children: formatDate(log.timestamp) }), _jsx("td", { className: "py-3 px-4 font-mono text-zinc-400 text-xs", children: formatHash(log.ip_address_hash, 12) }), _jsx("td", { className: "py-3 px-4 font-mono text-zinc-400 text-xs", children: formatHash(log.event_id, 8) })] }, log.event_id))) })] }) })) })] })] }));
}
//# sourceMappingURL=audit.js.map