/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RAGENT_CONTROLLER?: `0x${string}`;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
