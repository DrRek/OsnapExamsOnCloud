import { PublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser'
import { loginRequest, msalConfig } from './authConfig';


// Create the main myMSALObj instance
// configuration parameters are located at authConfig.js
const myMSALObj = new PublicClientApplication(msalConfig);

let username = "";

function selectAccount() {

    /**
     * See here for more info on account retrieval: 
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/Accounts.md
     */

    const currentAccounts = myMSALObj.getAllAccounts();
    if (currentAccounts.length === 0) {
        return;
    } else if (currentAccounts.length > 1) {
        // Add choose account code here
        console.warn("Multiple accounts detected.");
    } else if (currentAccounts.length === 1) {
        username = currentAccounts[0].username;
        alert(username);
    }
}

export async function signIn() {

    /**
     * You can pass a custom request object below. This will override the initial configuration. For more information, visit:
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/request-response-object.md#request
     */
    try {
        const response = await myMSALObj.loginPopup(loginRequest)

        if (response !== null) {
            username = response.account.username;
        } else {
            selectAccount();
        }
    } catch (error) {
        console.error(error);
    }
}

//function signOut() {
//
//    /**
//     * You can pass a custom request object below. This will override the initial configuration. For more information, visit:
//     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/request-response-object.md#request
//     */
//
//    const logoutRequest = {
//        account: myMSALObj.getAccountByUsername(username),
//        postLogoutRedirectUri: msalConfig.auth.redirectUri,
//        mainWindowRedirectUri: msalConfig.auth.redirectUri
//    };
//
//    myMSALObj.logoutPopup(logoutRequest);
//}

export function getTokenPopup(request) {

    /**
     * See here for more info on account retrieval: 
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/Accounts.md
     */
    request.account = myMSALObj.getAccountByUsername(username);
    
    return myMSALObj.acquireTokenSilent(request)
        .catch(error => {
            console.warn("silent token acquisition fails. acquiring token using popup");
            if (error instanceof InteractionRequiredAuthError) {
                // fallback to interaction when silent call fails
                return myMSALObj.acquireTokenPopup(request)
                    .then(tokenResponse => {
                        console.log(tokenResponse);
                        return tokenResponse;
                    }).catch(error => {
                        console.error(error);
                    });
            } else {
                console.warn(error);   
            }
    });
}

//selectAccount();