# Authentication & Redirect Flow

```mermaid
flowchart TD
    subgraph Login_Flow ["1. Login Step"]
        A["User enters credentials or OTP on Login Page"] --> B["performRedirect(accessToken, router, '/home', refreshToken)"]
    end

    subgraph Terms_Flow ["2. Terms & Conditions Evaluation"]
        B --> C{"Tenant has Terms & Conditions enabled?<br/>(localStorage: has_terms_and_conditions)"}
        C -- "No" --> G{"Is redirectUrl present?"}
        C -- "Yes" --> D{"Already accepted in Profile?<br/>(GET /user/v1/user/read)"}
        D -- "Yes (has_accepted_terms_and_conditions = true)" --> G
        D -- "No" --> E["Save tokens to session (tcAccToken, tcRefToken)<br/>and route to /terms"]
        E --> F["User reviews Terms & Conditions page and clicks 'I Agree'"]
        F --> F1["PATCH /user/v1/user/update:<br/>{ has_accepted_terms_and_conditions: true }"]
        F1 --> B2["Call performRedirect(accToken, router, defaultRoute, refToken)"]
        B2 --> G
    end

    subgraph Redirection_Flow ["3. Destination & Cleanup"]
        G -- "Yes (External SSO flow)" --> H["Construct targetUrl appending query params:<br/>?accToken=...&refToken=..."]
        H --> I["clearAllStorageAndCookies():<br/>Wipe all localStorage, sessionStorage, cookies & IndexedDB"]
        I --> J["window.location.replace(targetUrl)"]
        G -- "No (Standard portal user)" --> K["router.replace('/home')"]
    end

    style Login_Flow fill:#f8fafc,stroke:#94a3b8,stroke-width:1px
    style Terms_Flow fill:#fdf4ff,stroke:#d946ef,stroke-width:1px
    style Redirection_Flow fill:#f0fdf4,stroke:#22c55e,stroke-width:1px
    style I fill:#fef2f2,stroke:#ef4444,stroke-width:2px
    style J fill:#ecfdf5,stroke:#059669,stroke-width:2px
```

---

### Redirection Summary

1. **Login Step**: User authenticates with password or OTP; tokens are passed to `performRedirect`.
2. **Terms Evaluation**:
   - If tenant requires Terms & Conditions and the user has not accepted them (`has_accepted_terms_and_conditions === false`), they are routed to `/terms`.
   - Once the user clicks **"I Agree"**, `PATCH /user/v1/user/update` updates profile acceptance, and `performRedirect` is called again.
3. **Destination & Storage Clearing**:
   - If `redirectUrl` is present: Appends `accToken` and `refToken` to the URL, runs `clearAllStorageAndCookies()` (clearing `localStorage`, `sessionStorage`, cookies, and `IndexedDB`), and navigates to the target URL via `window.location.replace`.
   - If no `redirectUrl`: Navigates to `/home` via `router.replace`.
