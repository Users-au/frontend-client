import React, { useEffect } from 'react';
import { useUsersau } from '../../dist/react.js';

const styles: Record<string, React.CSSProperties> = {
    container: {
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f4f8',
        padding: '1rem',
    },
    card: {
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 4px 24px rgba(0,0,0,.1)',
        padding: '2rem',
        maxWidth: 440,
        width: '100%',
        textAlign: 'center',
    },
    h1: { fontSize: '1.5rem', marginBottom: '0.25rem', color: '#1a202c' },
    subtitle: { color: '#718096', fontSize: '0.875rem', marginBottom: '1.5rem' },
    avatar: { width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', marginBottom: '1rem' },
    name: { fontSize: '1.2rem', fontWeight: 600, color: '#2d3748' },
    email: { color: '#718096', fontSize: '0.875rem', margin: '0.25rem 0 1rem' },
    badgeAuthed: {
        display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: 9999,
        fontSize: '0.75rem', fontWeight: 600, background: '#c6f6d5', color: '#22543d', marginBottom: '1rem',
    },
    badgeGuest: {
        display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: 9999,
        fontSize: '0.75rem', fontWeight: 600, background: '#fed7d7', color: '#742a2a', marginBottom: '1rem',
    },
    btnGroup: { display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' },
    btnPrimary: {
        padding: '0.75rem 1.5rem', borderRadius: 8, border: 'none',
        fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', background: '#4f46e5', color: '#fff',
    },
    btnSecondary: {
        padding: '0.75rem 1.5rem', borderRadius: 8, border: 'none',
        fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', background: '#e2e8f0', color: '#2d3748',
    },
    btnDanger: {
        padding: '0.75rem 1.5rem', borderRadius: 8, border: 'none',
        fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', background: '#fc8181', color: '#fff',
    },
};

export function App() {
    const { user, isAuthenticated, isLoading, error, login, logout, register, account, handleCallback } = useUsersau();

    // Handle OAuth callback on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.has('code')) {
            handleCallback().catch((err) => {
                console.error('Callback failed:', err);
                window.history.replaceState({}, '', window.location.pathname);
            });
        }
    }, []);

    if (isLoading) {
        return (
            <div style={styles.container}>
                <div style={styles.card}>Processing login…</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.container}>
                <div style={{ ...styles.card, border: '1px solid #fc8181' }}>
                    <p style={{ color: '#742a2a', marginBottom: '1rem' }}>Authentication failed: {error.message}</p>
                    <button
                        style={styles.btnSecondary}
                        onClick={() => window.history.replaceState({}, '', window.location.pathname)}
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div>
                <h1 style={styles.h1}>Users.au Demo</h1>
                <p style={styles.subtitle}>React — @users-au/client/react</p>

                <div style={styles.card}>
                    {isAuthenticated ? (
                        <>
                            {user?.avatar && (
                                <img src={user.avatar} alt={user.name} style={styles.avatar as React.CSSProperties} />
                            )}
                            <div style={styles.name}>{user?.name}</div>
                            <div style={styles.email}>{user?.email}</div>
                            <div style={styles.badgeAuthed}>Authenticated ✓</div>
                            <div style={styles.btnGroup}>
                                <button style={styles.btnSecondary} onClick={account}>Manage Account</button>
                                <button style={styles.btnDanger} onClick={logout}>Logout</button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={styles.badgeGuest}>Not authenticated</div>
                            <div style={styles.btnGroup}>
                                <button style={styles.btnPrimary} onClick={login}>Login with Users.au</button>
                                <button style={styles.btnSecondary} onClick={register}>Register with Users.au</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
