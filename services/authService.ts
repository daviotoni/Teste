
import type { User } from '../types';

class AuthService {
    private bufferToHex(buffer: ArrayBuffer): string {
        return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');
    }

    private hexToBuffer(hex: string): ArrayBuffer {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
        }
        return bytes.buffer;
    }

    async hashPassword(password: string): Promise<{ salt: string; hash: string }> {
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const encoder = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveBits']
        );
        const derivedKey = await window.crypto.subtle.deriveBits(
            { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
            keyMaterial,
            256
        );
        return {
            salt: this.bufferToHex(salt),
            hash: this.bufferToHex(derivedKey)
        };
    }

    async verifyPassword(password: string, saltHex: string, hashHex: string): Promise<boolean> {
        const salt = this.hexToBuffer(saltHex);
        const encoder = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveBits']
        );
        const derivedKey = await window.crypto.subtle.deriveBits(
            { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
            keyMaterial,
            256
        );
        return this.bufferToHex(derivedKey) === hashHex;
    }
    
    async initializeDefaultUser() {
        // Intentionally empty: institutional accounts are provisioned by the identity provider.
    }

    async login(login: string, pass: string): Promise<User | null> {
        void login;
        void pass;
        // Local credentials were removed; the upcoming login screen will use OIDC/Supabase Auth.
        return null;
    }

    logout() {
        sessionStorage.removeItem('loggedInUser');
    }

    getLoggedInUser(): User | null {
        const userJson = sessionStorage.getItem('loggedInUser');
        return userJson ? JSON.parse(userJson) : null;
    }
}

export const authService = new AuthService();
