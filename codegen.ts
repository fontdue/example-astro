import 'dotenv/config';
import type { CodegenConfig } from '@graphql-codegen/cli';

const url = process.env.PUBLIC_FONTDUE_URL;
if (!url) {
  throw new Error('PUBLIC_FONTDUE_URL must be set in .env to run codegen');
}

const config: CodegenConfig = {
  schema: `${url}/graphql`,
  documents: './src/queries/*.graphql',
  generates: {
    './src/queries/operations-types.ts': {
      plugins: ['typescript', 'typescript-operations'],
      config: {
        onlyOperationTypes: true,
        preResolveTypes: true,
        skipTypename: true,
        avoidOptionals: true,
      },
    },
  },
};

export default config;
