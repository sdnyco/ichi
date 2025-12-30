### M7 — Deployability & Place Ops

**Intent**
Make it operationally deployable across multiple real places.

**Scope**

* Place + portal management flow (admin)
* Seed/creation tooling for places and portals
* Basic analytics/logging for:

  * check-ins created
  * pings sent
  * errors
* Production hardening:

  * env validation
  * error boundaries
  * basic performance hygiene

**Definition of Done**

* Multiple places can be configured and used without code changes
* Portals can be activated/disabled safely
* App is deployable and stable enough for live pilot use

**Explicitly Not Included**

* Full analytics suite
* A/B testing
* Deep metrics dashboards