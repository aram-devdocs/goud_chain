import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useSubmitData, useToast } from '@workspace/hooks';
import { Button, Input, Label, Card, CardHeader, CardTitle, CardContent } from '@workspace/ui';
import { encryptData } from '@workspace/utils';
export default function SubmitPage() {
    const [collectionId, setCollectionId] = useState('');
    const [data, setData] = useState('');
    const { success, error } = useToast();
    const submitMutation = useSubmitData();
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const apiKey = localStorage.getItem('api_key');
            if (!apiKey) {
                error('API key not found. Please log in again.');
                return;
            }
            const encryptedData = await encryptData(data, apiKey);
            await submitMutation.mutateAsync({
                collection_id: collectionId,
                encrypted_data: encryptedData,
            });
            success('Data submitted successfully');
            setData('');
        }
        catch (err) {
            error(err.message);
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-3xl font-bold text-white mb-2", children: "Submit Data" }), _jsx("p", { className: "text-zinc-500", children: "Encrypt and submit data to the blockchain" })] }), _jsxs(Card, { className: "max-w-2xl", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Encrypt & Submit" }) }), _jsx(CardContent, { children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "collectionId", children: "Collection ID" }), _jsx(Input, { id: "collectionId", value: collectionId, onChange: (e) => setCollectionId(e.target.value), placeholder: "e.g., medical_records", required: true, className: "mt-1" }), _jsx("p", { className: "text-xs text-zinc-500 mt-1", children: "Group related data together using a collection identifier" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "data", children: "Data (will be encrypted)" }), _jsx("textarea", { id: "data", value: data, onChange: (e) => setData(e.target.value), placeholder: "Enter your data here...", required: true, rows: 6, className: "w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-white mt-1" }), _jsx("p", { className: "text-xs text-zinc-500 mt-1", children: "Data is encrypted client-side before submission" })] }), _jsx(Button, { type: "submit", className: "w-full", disabled: submitMutation.isPending, children: submitMutation.isPending ? 'Submitting...' : 'Submit Data' })] }) })] })] }));
}
//# sourceMappingURL=submit.js.map