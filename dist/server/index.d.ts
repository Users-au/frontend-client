/** Server-only confidential-client helpers. Never import credentials into browser bundles. */
export interface ApplicationContext {
    context_id: string;
    branding: {
        name: string;
        logo_url?: string;
        logo_dark_url?: string;
        favicon_url?: string;
        theme_color?: string;
    };
    links: {
        home_url: string;
        support_url?: string;
        logout_url?: string;
    };
}
export interface ConfidentialClientConfig {
    host: string;
    clientId: string;
    clientSecret: string;
}
export interface PushedAuthorizationParameters {
    redirect_uri: string;
    state: string;
    code_challenge: string;
    scope?: string;
}
export declare function createPushedAuthorizationUrl(config: ConfidentialClientConfig, parameters: PushedAuthorizationParameters, context: ApplicationContext): Promise<string>;
/** Creates appearance/navigation context only. Auth still checks its own signed-in session. */
export declare function createApplicationContextUrl(config: ConfidentialClientConfig, purpose: 'account' | 'logout', context: ApplicationContext): Promise<string>;
