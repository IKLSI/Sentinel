import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import apiClient from "@/services/client";

apiClient.defaults.adapter = (config) =>
  Promise.reject(
    new Error(
      `Appel HTTP non mocké : ${config.method?.toUpperCase()} ${config.url}. ` +
        "Mockez @/services/client dans le test concerné.",
    ),
  );

afterEach(() => {
  cleanup();
  localStorage.clear();
});
