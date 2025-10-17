import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useAuth, useCreateAccount, useLogin, useToast } from '@workspace/hooks';
import { Button, Input, Label, Card, CardHeader, CardTitle, CardContent } from '@workspace/ui';
export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [apiKey, setApiKey] = useState('');
    const { login } = useAuth();
    const { success, error } = useToast();
    const createAccountMutation = useCreateAccount();
    const loginMutation = useLogin();
    const handleCreateAccount = async (e) => {
        e.preventDefault();
        try {
            const result = await createAccountMutation.mutateAsync({ username });
            setApiKey(result.api_key);
            success('Account created! Save your API key securely.');
        }
        catch (err) {
            error(err.message);
        }
    };
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const result = await loginMutation.mutateAsync({ api_key: apiKey });
            login(result);
            success('Logged in successfully');
        }
        catch (err) {
            error(err.message);
        }
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-black p-4", children: _jsxs(Card, { className: "w-full max-w-md", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { className: "text-2xl", children: "Goud Chain" }), _jsx("p", { className: "text-sm text-zinc-500 mt-2", children: "Encrypted Blockchain Platform" })] }), _jsxs(CardContent, { children: [_jsxs("div", { className: "flex gap-2 mb-6", children: [_jsx(Button, { variant: isLogin ? 'primary' : 'secondary', onClick: () => setIsLogin(true), className: "flex-1", children: "Login" }), _jsx(Button, { variant: !isLogin ? 'primary' : 'secondary', onClick: () => setIsLogin(false), className: "flex-1", children: "Create Account" })] }), isLogin ? (_jsxs("form", { onSubmit: handleLogin, className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "apiKey", children: "API Key" }), _jsx(Input, { id: "apiKey", type: "password", value: apiKey, onChange: (e) => setApiKey(e.target.value), placeholder: "Enter your API key", required: true, className: "mt-1" })] }), _jsx(Button, { type: "submit", className: "w-full", disabled: loginMutation.isPending, children: loginMutation.isPending ? 'Logging in...' : 'Login' })] })) : (_jsxs("form", { onSubmit: handleCreateAccount, className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "username", children: "Username" }), _jsx(Input, { id: "username", value: username, onChange: (e) => setUsername(e.target.value), placeholder: "Choose a username", required: true, className: "mt-1" })] }), _jsx(Button, { type: "submit", className: "w-full", disabled: createAccountMutation.isPending, children: createAccountMutation.isPending ? 'Creating...' : 'Create Account' }), apiKey && (_jsxs("div", { className: "mt-4 p-4 bg-yellow-950/50 border border-yellow-700 rounded-lg", children: [_jsx("p", { className: "text-sm text-yellow-400 mb-2 font-semibold", children: "Save this API key securely:" }), _jsx("code", { className: "block p-2 bg-black rounded text-xs break-all font-mono text-yellow-300", children: apiKey })] }))] }))] })] }) }));
}
//# sourceMappingURL=auth.js.map