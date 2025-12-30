**Investigation recap (no changes yet):**

1. **Code location** – The failing fetch lives in `src/components/place-ping-panel.tsx` inside `refreshActiveCheckin`. On mount (and whenever `checkinVersion` changes) we call `fetch(/api/me/place-context?placeId=…&userId=…)` as soon as `initialViewerUserId` is non-null.

2. **Params on first load** – On the first Safari visit we *do* have both params (from the server-rendered props), so the request is well-formed. The client fires the effect twice in rapid succession (React StrictMode + hydration), meaning two identical requests hit `/api/me/place-context` simultaneously.

3. **Server response** – The API calls `getOrCreatePlaceProfile`, which first queries for an existing `place_profiles` row, then inserts if none exists. When two requests race, both miss the pre-check and both attempt `INSERT`, so the second write hits the unique constraint `place_profiles_user_place_unique`. That surfaces as a 500, which our client reduces to a generic `place_context_failed`. A refresh works because the row now exists and the query short-circuits before the insert.

**Plan for a minimal fix**

- On the client, only kick off the fetch once the required params are stable *and* ensure we don’t fire duplicate requests:
  - Track an `AbortController` or a simple “in-flight” flag so overlapping calls are cancelled when the component re-renders or unmounts.
  - Bail early if we already fetched successfully for the current `placeId`+`userId`.

- Improve the error handling so when `response.ok` is false we log the status + short body snippet; that will make future issues diagnosable instead of just “place_context_failed”.

- (Optional but recommended) add a tiny retry-with-delay for a single 409/500 response, since the underlying race window is only the very first insert; a quick retry after 100–200 ms would avoid even hitting the duplicate in most cases.

Let me know if you want me to implement that mitigation (gated fetch + abort + richer logging, with at most one retry).