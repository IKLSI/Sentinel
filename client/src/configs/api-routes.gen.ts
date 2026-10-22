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
    public: {
      __path: "/api/public",
      badge: {
        __path: "/api/public/badge",
        "{token}.svg": {
          __path: "/api/public/badge/{token}.svg",
        },
      },
      runtimeLifecycles: {
        __path: "/api/public/runtime-lifecycles",
      },
      scan: {
        __path: "/api/public/scan",
      },
      scoringModel: {
        __path: "/api/public/scoring-model",
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
        options: {
          __path: "/api/tech-health/projects/options",
        },
        ":id": {
          __path: "/api/tech-health/projects/:id",
          badge: {
            __path: "/api/tech-health/projects/:id/badge",
          },
          complianceReport: {
            __path: "/api/tech-health/projects/:id/compliance-report",
          },
          remediations: {
            __path: "/api/tech-health/projects/:id/remediations",
          },
          repositoryOptions: {
            __path: "/api/tech-health/projects/:id/repository-options",
          },
          sbom: {
            __path: "/api/tech-health/projects/:id/sbom",
          },
          scan: {
            __path: "/api/tech-health/projects/:id/scan",
          },
          suppressions: {
            __path: "/api/tech-health/projects/:id/suppressions",
            ":suppressionId": {
              __path:
                "/api/tech-health/projects/:id/suppressions/:suppressionId",
            },
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
      fromFinding: {
        __path: "/api/tickets/from-finding",
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
  },
} as const;
