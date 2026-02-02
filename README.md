# FitGirl FF Downloader

A Node.js utility designed to automate the downloading and extracting of FitGirl repacks using a locally saved game page HTML file.

---

## Prerequisites

Before you begin, make sure the following are installed and configured correctly:

### 1. Install Node.js

- Download and install Node.js from: [https://nodejs.org](https://nodejs.org)
- **Verify installation:**
  ```bash
  node -v
  ```

### 2. Install unrar (WinRAR)

- Download and install WinRAR from: [https://www.win-rar.com/](https://www.win-rar.com/)
- **Default installation path:**
  ```makefile
  C:\Program Files\WinRAR
  ```

### 3. Add WinRAR to PATH (Manual Method)

If `unrar` is not recognized in your terminal, follow these steps:

1.  Press **Win + R**, type `sysdm.cpl`, and press **Enter**.
2.  Go to the **Advanced** tab.
3.  Click **Environment Variables**.
4.  Under **System variables**, find and select `Path`, then click **Edit**.
5.  Click **New** and add:
    ```makefile
    C:\Program Files\WinRAR
    ```
6.  Click **OK** on all windows to save.
7.  **Restart your terminal.**

**Verify it works:**

```bash
unrar
```

### 4. Install project dependencies

In the root directory of this project, run:

```bash
npm install
```

### Setup Instructions

1. **Download the HTML file** Visit FITGIRL Repacks and download the **raw HTML file** of your desired game's page.
2. **Save the file** Rename the downloaded file to index.html and place it in the **root directory** of this repository.
3. **Run the project** Open your terminal in the project directory and run:

```bash
node index.js
```
