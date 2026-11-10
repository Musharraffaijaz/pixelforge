// PixelForge Background Service Worker
// Manages standalone window, tab views, and file downloads

async function openAppWindow() {
  const windowUrl = chrome.runtime.getURL('index.html?mode=window');

  // Check if an existing PixelForge window or tab is already open
  try {
    const tabs = await chrome.tabs.query({ url: chrome.runtime.getURL('index.html*') });
    for (const tab of tabs) {
      if (tab.windowId) {
        try {
          const win = await chrome.windows.get(tab.windowId);
          if (win) {
            await chrome.windows.update(tab.windowId, { focused: true });
            if (tab.id) {
              await chrome.tabs.update(tab.id, { active: true });
            }
            return;
          }
        } catch {
          // Window might no longer exist, continue checking
        }
      }
    }
  } catch (err) {
    console.warn('Could not query existing tabs:', err);
  }

  // Calculate window geometry near top-right of current screen/window
  const width = 460;
  const height = 720;
  let left = undefined;
  let top = undefined;

  try {
    const currentWin = await chrome.windows.getCurrent();
    if (currentWin && currentWin.left !== undefined && currentWin.width !== undefined) {
      left = Math.max(10, Math.round(currentWin.left + currentWin.width - width - 20));
      top = Math.max(10, Math.round((currentWin.top || 0) + 60));
    }
  } catch (e) {
    console.warn('Could not determine current window geometry:', e);
  }

  await chrome.windows.create({
    url: windowUrl,
    type: 'popup',
    width,
    height,
    left,
    top,
    focused: true,
  });
}

// When user clicks extension icon in toolbar, open or focus standalone window
chrome.action.onClicked.addListener(openAppWindow);

// Handle messages from UI
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'DOWNLOAD_FILE') {
    const { url, filename } = message;
    chrome.downloads.download({ url, filename }, (downloadId) => {
      sendResponse({ success: true, downloadId });
    });
    return true; // keep channel open for async response
  }

  if (message.type === 'OPEN_WINDOW') {
    openAppWindow().then(() => sendResponse({ success: true }));
    return true;
  }

  if (message.type === 'OPEN_TAB') {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html?mode=tab') });
    sendResponse({ success: true });
    return true;
  }
});
