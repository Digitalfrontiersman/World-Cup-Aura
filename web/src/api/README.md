# `api/` — vendored HTTP client

This is a **self-contained copy** of the app's API client (originally the shared
`@workspace/api-client-react` package in the monorepo). It's vendored here so the
`web/` app depends on nothing outside its own folder.

- `custom-fetch.ts` — thin `fetch` wrapper: base-URL prefixing, JSON handling,
  and the `ApiError` class. Call `setBaseUrl()` once at startup.
- `generated/api.ts` + `generated/api.schemas.ts` — React Query hooks + types,
  generated from the backend's OpenAPI spec (orval). **Do not hand-edit**; if the
  backend API changes, regenerate these from the spec and drop them back in here.
- `index.ts` — re-exports everything. Import from `@/api`.

Only depends on `@tanstack/react-query`.
