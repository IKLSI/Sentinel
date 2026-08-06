import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import apiClient from "@/configs/apiClient";

apiClient.defaults.adapter = (config) =>
  Promise.reject(
    new Error(
      `Unmocked HTTP call: ${config.method?.toUpperCase()} ${config.url}. ` +
        "Mock @/configs/apiClient in the related test.",
    ),
  );

afterEach(() => {
  cleanup();
  localStorage.clear();
});
