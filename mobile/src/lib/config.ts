import Constants from 'expo-constants';

type AppExtra = {
  apiBaseUrl: string;
  mainServiceBaseUrl: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<AppExtra>;

export const config = {
  apiBaseUrl: extra.apiBaseUrl ?? 'http://localhost:4000/api',
  mainServiceBaseUrl: extra.mainServiceBaseUrl ?? 'http://localhost:8000',
};
