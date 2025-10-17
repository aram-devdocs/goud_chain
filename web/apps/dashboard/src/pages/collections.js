import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useListCollections } from '@goudchain/hooks';
import { Card, CardHeader, CardTitle, CardContent, Spinner } from '@goudchain/ui';
import { formatDate, formatNumber } from '@goudchain/utils';
export default function CollectionsPage() {
    const { data, isLoading } = useListCollections();
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx(Spinner, { size: "lg" }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-3xl font-bold text-white mb-2", children: "Collections" }), _jsx("p", { className: "text-zinc-500", children: "Your encrypted data collections" })] }), data?.collections.length === 0 ? (_jsx(Card, { children: _jsx(CardContent, { className: "text-center py-12", children: _jsx("p", { className: "text-zinc-500", children: "No collections yet. Submit some data to get started!" }) }) })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: data?.collections.map((collection) => (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-lg truncate", children: collection.collection_id }) }), _jsxs(CardContent, { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-zinc-400", children: "Data Count:" }), _jsx("span", { className: "text-white font-mono", children: formatNumber(collection.data_count) })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-zinc-400", children: "Created:" }), _jsx("span", { className: "text-white font-mono text-xs", children: formatDate(collection.created_at) })] }), _jsxs("div", { className: "text-zinc-500 text-xs break-all", children: [_jsx("span", { children: "Blind Index:" }), _jsxs("code", { className: "block mt-1 p-1 bg-zinc-900 rounded", children: [collection.blind_index.slice(0, 16), "..."] })] })] })] }, collection.collection_id))) }))] }));
}
//# sourceMappingURL=collections.js.map