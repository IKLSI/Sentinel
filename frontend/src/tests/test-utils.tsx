import type { ReactElement, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastProvider";
import { I18nProvider } from "@/contexts/I18nContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Language } from "@/enums";

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface AllProvidersProps {
  children: ReactNode;
  queryClient: QueryClient;
  language: Language;
}

function AllProviders({ children, queryClient, language }: AllProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider initialLanguage={language}>
        <AuthProvider>
          <ThemeProvider>
            <ToastProvider>{children}</ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
  language?: Language;
}

function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {},
) {
  const {
    queryClient = createTestQueryClient(),
    language = Language.Fr,
    ...renderOptions
  } = options;

  return {
    user: userEvent.setup(),
    queryClient,
    ...render(ui, {
      wrapper: ({ children }) => (
        <AllProviders queryClient={queryClient} language={language}>
          {children}
        </AllProviders>
      ),
      ...renderOptions,
    }),
  };
}

export * from "@testing-library/react";
export { renderWithProviders as render };
