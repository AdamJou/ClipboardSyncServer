#!/usr/bin/env node
import { WebSocketServer } from "ws";
import clipboardy from "clipboardy";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { app, Tray, Menu, dialog } from "electron";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let wss = null;
let tray = null;
let serverRunning = false;

let lastClipboardContent = "";
let lastImageHash = null;

const PORT = 8080;
const IMAGE_SAVE_PATH = path.join(__dirname, "clipboard_images");

if (!fs.existsSync(IMAGE_SAVE_PATH)) {
  fs.mkdirSync(IMAGE_SAVE_PATH);
}

function startServer() {
  if (wss) {
    dialog.showMessageBox({ message: "Serwer już działa!" });
    return;
  }

  wss = new WebSocketServer({ port: PORT });
  console.log(`Server running on ws://localhost:${PORT}`);

  wss.on("connection", (ws) => {
    console.log("Client connected.");
    if (lastClipboardContent) {
      ws.send(
        JSON.stringify({ type: "clipboard", data: lastClipboardContent })
      );
    }

    ws.on("close", () => {
      console.log("Client disconnected.");
    });
  });

  setInterval(() => {
    try {
      const currentText = clipboardy.readSync();
      if (currentText !== lastClipboardContent) {
        lastClipboardContent = currentText;
        console.log("Text clipboard changed:", currentText);

        wss.clients.forEach((client) => {
          if (client.readyState === client.OPEN) {
            client.send(
              JSON.stringify({ type: "clipboard", data: currentText || "" })
            );
          }
        });
      }
    } catch (error) {}

    const base64Image = saveClipboardImage();
    if (base64Image && wss) {
      console.log("Image clipboard changed and sent to clients.");
      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(
            JSON.stringify({ type: "clipboard-image", data: base64Image })
          );
        }
      });
    }
  }, 1000);

  serverRunning = true;
  dialog.showMessageBox({ message: "Serwer został uruchomiony." });
}

function stopServer() {
  if (wss) {
    wss.clients.forEach((client) => client.close());
    wss.close();
    wss = null;
    console.log("Server stopped.");
    serverRunning = false;
    dialog.showMessageBox({ message: "Serwer został zatrzymany." });
  } else {
    dialog.showMessageBox({ message: "Serwer nie działa." });
  }
}

function logToFile(message) {
  const logFilePath = path.join(
    process.resourcesPath || __dirname,
    "debug.log"
  );
  const timestamp = new Date().toISOString();
  try {
    fs.appendFileSync(logFilePath, `[${timestamp}] ${message}\n`);
  } catch (error) {
    console.error("Failed to write to log file:", error.message);
  }
}

function saveClipboardImage() {
  try {
    const psScriptPath =
      process.env.NODE_ENV === "production"
        ? path.join(process.resourcesPath, "app", "save_clipboard_image.ps1")
        : path.join(__dirname, "save_clipboard_image.ps1");

    logToFile(`Running PowerShell script at: ${psScriptPath}`);

    const result = execSync(
      `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${psScriptPath}"`,
      { stdio: "pipe" }
    )
      .toString()
      .trim();

    logToFile(`PowerShell result: ${result}`);

    if (result && fs.existsSync(result)) {
      const imageBuffer = fs.readFileSync(result);
      const imageHash = imageBuffer.toString("base64").slice(0, 32);

      if (imageHash !== lastImageHash) {
        lastImageHash = imageHash;

        const outputFilePath = path.join(
          IMAGE_SAVE_PATH,
          `clipboard_image_${Date.now()}.bmp`
        );
        fs.copyFileSync(result, outputFilePath);

        logToFile(`Saved image to: ${outputFilePath}`);

        return imageBuffer.toString("base64");
      }
    }
  } catch (error) {
    logToFile(`Error in saveClipboardImage: ${error.message}`);
    if (error.stderr) {
      logToFile(`PowerShell stderr: ${error.stderr.toString()}`);
    }
    if (error.stdout) {
      logToFile(`PowerShell stdout: ${error.stdout.toString()}`);
    }
  }
  return null;
}

app.whenReady().then(() => {
  tray = new Tray(path.join(__dirname, "tray.png"));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Start Server",
      click: startServer,
    },
    {
      label: "Stop Server",
      click: stopServer,
    },
    {
      type: "separator",
    },
    {
      label: "Exit",
      click: () => {
        stopServer();
        app.quit();
      },
    },
  ]);

  tray.setToolTip("Clipboard Sync Server");
  tray.setContextMenu(contextMenu);
});
