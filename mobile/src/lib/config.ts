import Constants from 'expo-constants';

type AppExtra = {
  apiBaseUrl: string;
  mainServiceBaseUrl: string;
  rentersRightsPdfUrl: string;
  rentersRightsPdfVersion: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<AppExtra>;

export const config = {
  apiBaseUrl: extra.apiBaseUrl ?? 'http://localhost:4000/api',
  mainServiceBaseUrl: extra.mainServiceBaseUrl ?? 'http://localhost:8000',
  rentersRightsPdfUrl:
    extra.rentersRightsPdfUrl ??
    'https://cdn.studentmoves.co.uk/public/renters-rights-2026-v1.pdf',
  rentersRightsPdfVersion: extra.rentersRightsPdfVersion ?? 'renters-rights-2026-v1',
};
