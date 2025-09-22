[33mcommit e808189f23ee83f6e7ebba00dc1b4c198466c33c[m
Author: jviciana84 <viciana84@gmail.com>
Date:   Fri Sep 19 22:38:08 2025 +0200

    feat: Add compact search bar to all dashboard pages and fix z-index issues
    
    - Add CompactSearchWithModal component to all sidebar pages
    - Position search bar to the right of breadcrumbs consistently
    - Fix z-index conflicts between search bar and theme selector
    - Implement auto-close functionality for theme selector menu
    - Reduce search bar height for better visual balance
    - Ensure consistent UX across all dashboard pages

 app/dashboard/entregas/page.tsx                    |  28 [32m++[m[31m---[m
 app/dashboard/extornos/page.tsx                    |   6 [32m+[m[31m-[m
 .../incentivos/incentivos-page-client.tsx          |  28 [32m++[m[31m---[m
 app/dashboard/llaves/page.tsx                      |   6 [32m+[m[31m-[m
 app/dashboard/nuevas-entradas/page.tsx             |   6 [32m+[m[31m-[m
 app/dashboard/photos/page.tsx                      |   6 [32m+[m[31m-[m
 app/dashboard/profile/page.tsx                     |  12 [32m++[m[31m-[m
 app/dashboard/recogidas/page.tsx                   |  28 [32m++[m[31m---[m
 app/dashboard/reports/page.tsx                     |  28 [32m++[m[31m---[m
 app/dashboard/settings/page.tsx                    |   6 [32m+[m[31m-[m
 app/dashboard/validados/page.tsx                   |   6 [32m+[m[31m-[m
 app/dashboard/vehicles/page.tsx                    |  28 [32m++[m[31m---[m
 app/dashboard/ventas/page.tsx                      |   6 [32m+[m[31m-[m
 components/dashboard/compact-search-with-modal.tsx |  49 [32m+++++++++[m
 components/dashboard/compact-search.tsx            | 115 [32m+++++++++++++++++++++[m
 components/dashboard/dashboard-content.tsx         |   2 [32m+[m[31m-[m
 components/dashboard/header.tsx                    |   4 [32m+[m[31m-[m
 components/theme-toggle.tsx                        |  53 [32m+++++++++[m[31m-[m
 lib/version.ts                                     |   6 [32m+[m[31m-[m
 19 files changed, 343 insertions(+), 80 deletions(-)
