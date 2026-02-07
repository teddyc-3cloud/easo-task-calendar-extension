import { useCallback } from 'react';
let vscodeApi: VsCodeApi | null = null;
function getVsCodeApi(): VsCodeApi { if (!vscodeApi) vscodeApi = acquireVsCodeApi(); return vscodeApi; }
export function useVsCodeApi() { const postMessage = useCallback((message: any) => { getVsCodeApi().postMessage(message); }, []); return { postMessage }; }
