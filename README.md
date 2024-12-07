
# Clipboard Sync Server

Clipboard Sync Server is an application that allows you to synchronize your clipboard between your computer and mobile devices.
To use we also need an app for android phone [ClipboardSyncApp](https://github.com/TwojeKonto/ClipboardSyncApp).

## Features

- Synchronization of text from the clipboard in real time.
- Support for clipboard images in Base64 format.
- WebSocket server to support connections between devices.
- Ability to start and stop the server using the icon in the system tray.

## Requirements

- Node.js version 16 or later
- PowerShell (for clipboard image handling)
- Windows operating system


## Installation

1. clone this repository:
   ```bash
   git clone https://github.com/AdamJou/ClipboardSyncServer.git
   ```

2 Install dependencies:
   ```bash
   npm install
   ```

3 Check that all dependencies have been installed correctly:
   ```bash
   npm audit fix
   ```

## Launching the project in developer mode

To launch the application in developer mode:

```bash
npx electron .
```

## Building an application

To build a Windows application:

```bash
npx electron-packager . ClipboardSync --platform=win32 --arch=x64 --out=dist
```

You can find the executable file in the `dist` directory.


## How the application works

1. When you start the application, an icon appears in the system tray.
2. Right click on the tray icon to start or stop the server.
3. The WebSocket server starts on port `8080`.
4. Text and images copied to the clipboard are automatically sent to clients connected via [ClipboardSyncApp](https://github.com/TwojeKonto/ClipboardSyncApp) to the server.


## License
[MIT](LICENSE)
