xfreerdp /v:20.126.159.163 /u:studente /p:"" /dynamic-resolution
xfreerdp /v:20.126.159.163 /u:osnap /p:"" /dynamic-resolution


INSTRUCTIONS
TO CREATE A NEW COMPLETELY NEW VM
// To correctly create a virtual machine I have to follow this https://learn.microsoft.com/en-us/azure/virtual-machines/windows/upload-generalized-managed?toc=%252fazure%252fvirtual-machines%252fwindows%252ftoc.json
// https://learn.microsoft.com/en-us/azure/virtual-machines/windows/capture-image-resource
// You always have to create it as SPECIALIZED
// then you always run `net user student <anything> /add` to create the student user
// then `net localgroup "Remote Desktop Users" studente /add`
// Then configure the syncing script as such:
// then download https://drive.google.com/drive/folders/1aUFFmxFHcLxU4RyB0Gb6xkOEL8ChJtmL to C:\Users\studente\azcopy_windows_amd64_10.20.1
// set language and region to italian (test that the keyboard works correctly with italian layout)
// once that is finished open the VM in azure
// stop the machine and capture a new version of the image
// If possible create a new image version
// if not possible create a new image gallery and set 0.0.1 as version (if u create a new one you need to update IMAGE_OPTIONS in the NewExamsForm.jsx file)
// Image capture can take quite some time, wait a bit

// Try to start a VM / test launching as student and see if files gets stored

Clean up
* Remove unused resource groups
* Remove old broken images / image versions that are not needed anymore





# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
# OsnapExamsOnCloud
