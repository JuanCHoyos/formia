import 'aws-amplify/auth/enable-oauth-listener';
import { Amplify } from 'aws-amplify';
import { environment } from '@environments/environment';



Amplify.configure({
    Auth: {
        Cognito: {
            userPoolId: environment.cognito.userPoolId,
            userPoolClientId: environment.cognito.userPoolClientId,
            loginWith: {
                email: true,
                oauth: {
                    domain: environment.cognito.domain,
                    scopes: ['openid', 'email', 'profile'],
                    redirectSignIn: [environment.cognito.redirectSignIn],
                    redirectSignOut: [environment.cognito.redirectSignOut],
                    responseType: 'code',
                },
            },
        },
    },
});