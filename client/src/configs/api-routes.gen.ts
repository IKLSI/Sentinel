/**
 * Fichier généré automatiquement par "pnpm generate:api".
 * Ne pas modifier à la main.
 */

export const ROUTES_API = {
  api: {
    __path: "/api",
    auth: {
      __path: "/api/auth",
      forgotPassword: {
        __path: "/api/auth/forgot-password",
      },
      login: {
        __path: "/api/auth/login",
      },
      logout: {
        __path: "/api/auth/logout",
      },
      me: {
        __path: "/api/auth/me",
      },
      refresh: {
        __path: "/api/auth/refresh",
      },
      register: {
        __path: "/api/auth/register",
      },
      resendVerification: {
        __path: "/api/auth/resend-verification",
      },
      resetPassword: {
        __path: "/api/auth/reset-password",
      },
      verifyEmail: {
        __path: "/api/auth/verify-email",
      },
    },
    billing: {
      __path: "/api/billing",
      checkout: {
        __path: "/api/billing/checkout",
      },
      plans: {
        __path: "/api/billing/plans",
      },
      portal: {
        __path: "/api/billing/portal",
      },
      status: {
        __path: "/api/billing/status",
      },
      webhook: {
        __path: "/api/billing/webhook",
      },
    },
    config: {
      __path: "/api/config",
    },
    dashboard: {
      __path: "/api/dashboard",
      stats: {
        __path: "/api/dashboard/stats",
      },
    },
    jobs: {
      __path: "/api/jobs",
      techHealthScan: {
        __path: "/api/jobs/tech-health-scan",
        trigger: {
          __path: "/api/jobs/tech-health-scan/trigger",
        },
      },
    },
    locales: {
      __path: "/api/locales",
      ":culture": {
        __path: "/api/locales/:culture",
      },
    },
    settings: {
      __path: "/api/settings",
      apiKeys: {
        __path: "/api/settings/api-keys",
        ":id": {
          __path: "/api/settings/api-keys/:id",
        },
      },
      integrations: {
        __path: "/api/settings/integrations",
        github: {
          __path: "/api/settings/integrations/github",
        },
        gitlab: {
          __path: "/api/settings/integrations/gitlab",
        },
      },
      organization: {
        __path: "/api/settings/organization",
      },
    },
    techHealth: {
      __path: "/api/tech-health",
      projects: {
        __path: "/api/tech-health/projects",
        availableRepos: {
          __path: "/api/tech-health/projects/available-repos",
        },
        export: {
          __path: "/api/tech-health/projects/export",
          excel: {
            __path: "/api/tech-health/projects/export/excel",
          },
        },
        ":id": {
          __path: "/api/tech-health/projects/:id",
          complianceReport: {
            __path: "/api/tech-health/projects/:id/compliance-report",
          },
          sbom: {
            __path: "/api/tech-health/projects/:id/sbom",
          },
          scan: {
            __path: "/api/tech-health/projects/:id/scan",
          },
        },
      },
    },
    tickets: {
      __path: "/api/tickets",
      export: {
        __path: "/api/tickets/export",
        excel: {
          __path: "/api/tickets/export/excel",
        },
      },
      ":id": {
        __path: "/api/tickets/:id",
        attachments: {
          __path: "/api/tickets/:id/attachments",
          ":attachmentId": {
            __path: "/api/tickets/:id/attachments/:attachmentId",
          },
        },
        comments: {
          __path: "/api/tickets/:id/comments",
          ":commentId": {
            __path: "/api/tickets/:id/comments/:commentId",
          },
        },
      },
    },
    users: {
      __path: "/api/users",
      acceptInvitation: {
        __path: "/api/users/accept-invitation",
      },
      me: {
        __path: "/api/users/me",
        export: {
          __path: "/api/users/me/export",
        },
        preferences: {
          __path: "/api/users/me/preferences",
        },
      },
      ":id": {
        __path: "/api/users/:id",
      },
    },
    v1: {
      __path: "/api/v1",
      auth: {
        __path: "/api/v1/auth",
        forgotPassword: {
          __path: "/api/v1/auth/forgot-password",
        },
        login: {
          __path: "/api/v1/auth/login",
        },
        logout: {
          __path: "/api/v1/auth/logout",
        },
        me: {
          __path: "/api/v1/auth/me",
        },
        refresh: {
          __path: "/api/v1/auth/refresh",
        },
        register: {
          __path: "/api/v1/auth/register",
        },
        resendVerification: {
          __path: "/api/v1/auth/resend-verification",
        },
        resetPassword: {
          __path: "/api/v1/auth/reset-password",
        },
        verifyEmail: {
          __path: "/api/v1/auth/verify-email",
        },
      },
      billing: {
        __path: "/api/v1/billing",
        checkout: {
          __path: "/api/v1/billing/checkout",
        },
        plans: {
          __path: "/api/v1/billing/plans",
        },
        portal: {
          __path: "/api/v1/billing/portal",
        },
        status: {
          __path: "/api/v1/billing/status",
        },
        webhook: {
          __path: "/api/v1/billing/webhook",
        },
      },
      config: {
        __path: "/api/v1/config",
      },
      dashboard: {
        __path: "/api/v1/dashboard",
        stats: {
          __path: "/api/v1/dashboard/stats",
        },
      },
      jobs: {
        __path: "/api/v1/jobs",
        techHealthScan: {
          __path: "/api/v1/jobs/tech-health-scan",
          trigger: {
            __path: "/api/v1/jobs/tech-health-scan/trigger",
          },
        },
      },
      locales: {
        __path: "/api/v1/locales",
        ":culture": {
          __path: "/api/v1/locales/:culture",
        },
      },
      settings: {
        __path: "/api/v1/settings",
        apiKeys: {
          __path: "/api/v1/settings/api-keys",
          ":id": {
            __path: "/api/v1/settings/api-keys/:id",
          },
        },
        integrations: {
          __path: "/api/v1/settings/integrations",
          github: {
            __path: "/api/v1/settings/integrations/github",
          },
          gitlab: {
            __path: "/api/v1/settings/integrations/gitlab",
          },
        },
        organization: {
          __path: "/api/v1/settings/organization",
        },
      },
      techHealth: {
        __path: "/api/v1/tech-health",
        projects: {
          __path: "/api/v1/tech-health/projects",
          availableRepos: {
            __path: "/api/v1/tech-health/projects/available-repos",
          },
          export: {
            __path: "/api/v1/tech-health/projects/export",
            excel: {
              __path: "/api/v1/tech-health/projects/export/excel",
            },
          },
          ":id": {
            __path: "/api/v1/tech-health/projects/:id",
            complianceReport: {
              __path: "/api/v1/tech-health/projects/:id/compliance-report",
            },
            sbom: {
              __path: "/api/v1/tech-health/projects/:id/sbom",
            },
            scan: {
              __path: "/api/v1/tech-health/projects/:id/scan",
            },
          },
        },
      },
      tickets: {
        __path: "/api/v1/tickets",
        export: {
          __path: "/api/v1/tickets/export",
          excel: {
            __path: "/api/v1/tickets/export/excel",
          },
        },
        ":id": {
          __path: "/api/v1/tickets/:id",
          attachments: {
            __path: "/api/v1/tickets/:id/attachments",
            ":attachmentId": {
              __path: "/api/v1/tickets/:id/attachments/:attachmentId",
            },
          },
          comments: {
            __path: "/api/v1/tickets/:id/comments",
            ":commentId": {
              __path: "/api/v1/tickets/:id/comments/:commentId",
            },
          },
        },
      },
      users: {
        __path: "/api/v1/users",
        acceptInvitation: {
          __path: "/api/v1/users/accept-invitation",
        },
        me: {
          __path: "/api/v1/users/me",
          export: {
            __path: "/api/v1/users/me/export",
          },
          preferences: {
            __path: "/api/v1/users/me/preferences",
          },
        },
        ":id": {
          __path: "/api/v1/users/:id",
        },
      },
    },
  },
} as const;
