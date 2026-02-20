import { createDojoConfig } from "@dojoengine/core";
import manifest from "../contracts/manifest_sepolia.json";

export const dojoConfig = createDojoConfig({ manifest });
