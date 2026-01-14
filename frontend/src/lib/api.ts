export const API_BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3000';

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
    });

    if (!response.ok) {
        const errorMsg = `API Error: ${response.statusText}`;
        console.error(errorMsg);
        alert(errorMsg); // Temporary: Alert user on error
        throw new Error(errorMsg);
    }

    // Handle empty responses
    const text = await response.text();
    return (text ? JSON.parse(text) : {}) as T;
}
