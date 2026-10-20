export const environment = {
  API_URL: `${import.meta.env['NG_APP_API_URL']}api/v1`,
  cognito: {
    userPoolId: import.meta.env['NG_APP_COGNITO_USER_POOL_ID'],
    userPoolClientId: import.meta.env['NG_APP_COGNITO_USER_POOL_CLIENT_ID'],
    domain: import.meta.env['NG_APP_COGNITO_DOMAIN'],
    redirectSignIn: import.meta.env['NG_APP_COGNITO_REDIRECT_SIGN_IN'],
    redirectSignOut: import.meta.env['NG_APP_COGNITO_REDIRECT_SIGN_OUT'],
  },
};
