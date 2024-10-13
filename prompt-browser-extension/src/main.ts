import $ from 'jquery';
import ChangeEvent = JQuery.ChangeEvent;

const handleCurrentTab = () => {
  const documentHtml = document.body.innerHTML;
  const context = documentHtml.toString();
  // const emailsData = context.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);

  console.log(`context: ${context}`);
};

document.addEventListener(
  'DOMContentLoaded',
  (): void => {
    $('input[type="file"]').on('change', async (event: ChangeEvent): Promise<void> => {
      // t.hideErrorMessage();
      const tabData = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tabData.length === 0) {
        console.log(`NO TAB!`);
        return;
      }

      const tabId = tabData[0].id;
      console.log(`tabId: ${tabId}`);
      console.log(`event: ${event}`);
      console.log(`stringify-event: ${JSON.stringify(event)}`);

      if (tabId) {
        chrome.scripting.executeScript({
          target: { tabId },
          func: handleCurrentTab,
        });
      }

      //
    });
  },
  false,
);
