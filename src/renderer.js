/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';

console.log('👋 This message is being logged by "renderer.js", included via webpack');

// Тестові дані (надалі буде заміна на реальні)
const orders = [
  {
    title: 'USB кабель для зарядки',
    url: 'https://aliexpress.com/item/123',
    variation: '1м, чорний',
    count: 2,
  },
  {
    title: 'Bluetooth навушники',
    url: 'https://aliexpress.com/item/456',
    variation: 'Білий',
    count: 1,
  },
];

function renderTable(data) {
  const tbody = document.querySelector('#orders-table tbody');
  tbody.innerHTML = '';
  data.forEach(order => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${order.title}</td>
      <td><a href="${order.url}" class="link" target="_blank">${order.url}</a></td>
      <td>${order.variation}</td>
      <td>${order.count}</td>
    `;
    tbody.appendChild(tr);
  });
}

renderTable(orders);

// Експорт у JSON
function exportJSON() {
  const blob = new Blob([JSON.stringify(orders, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'orders.json';
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById('export-json').addEventListener('click', exportJSON);

// Експорт у CSV
function exportCSV() {
  const header = 'Назва товару,Посилання,Варіація,Кількість\n';
  const rows = orders.map(o => `"${o.title}","${o.url}","${o.variation}","${o.count}"`).join('\n');
  const csv = header + rows;
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'orders.csv';
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById('export-csv').addEventListener('click', exportCSV);

function scrapeOrdersFromWebview() {
  const webview = document.getElementById('aliexpress-webview');
  if (webview) {
    if (webview.isLoading()) {
      webview.addEventListener('dom-ready', () => {
        webview.executeJavaScript(`
          (function() {
            const orders = [];
            document.querySelectorAll('.order-item, .order-card, .order-list-item').forEach(item => {
              const title = item.querySelector('.product-title, .order-title, .product-name')?.innerText || '';
              const url = item.querySelector('a[href*="aliexpress.com/item"]')?.href || '';
              const variation = item.querySelector('.sku-property, .product-variation, .order-sku')?.innerText || '';
              const count = item.querySelector('.quantity, .order-quantity')?.innerText || '1';
              orders.push({ title, url, variation, count });
            });
            window.postMessage({ type: 'ORDERS_DATA', orders }, '*');
          })();
        `);
      }, { once: true });
    } else {
      webview.executeJavaScript(`
        (function() {
          const orders = [];
          document.querySelectorAll('.order-item, .order-card, .order-list-item').forEach(item => {
            const title = item.querySelector('.product-title, .order-title, .product-name')?.innerText || '';
            const url = item.querySelector('a[href*="aliexpress.com/item"]')?.href || '';
            const variation = item.querySelector('.sku-property, .product-variation, .order-sku')?.innerText || '';
            const count = item.querySelector('.quantity, .order-quantity')?.innerText || '1';
            orders.push({ title, url, variation, count });
          });
          window.postMessage({ type: 'ORDERS_DATA', orders }, '*');
        })();
      `);
    }
  }
}

function scaleWebview() {
  const webview = document.getElementById('aliexpress-webview');
  const wrap = document.querySelector('.ali-center-wrap');
  if (webview && wrap) {
    const availableWidth = wrap.offsetWidth;
    const baseWidth = 1200; // ширина "максимального" webview
    let scale = 1;
    if (availableWidth < baseWidth) {
      scale = availableWidth / baseWidth;
    }
    webview.style.transform = `scale(${scale})`;
    webview.style.width = baseWidth + 'px';
    webview.style.height = '90vh';
  }
}

window.addEventListener('resize', scaleWebview);
window.addEventListener('DOMContentLoaded', () => {
  scaleWebview();
  // DevTools для webview
  const devBtn = document.getElementById('open-devtools');
  const webview = document.getElementById('aliexpress-webview');
  if (devBtn && webview) {
    devBtn.addEventListener('click', () => {
      webview.openDevTools();
    });
  }
  // Перемикання вкладок
  const tabAli = document.getElementById('tab-aliexpress');
  const tabCat = document.getElementById('tab-catalog');
  const contentAli = document.getElementById('tab-content-aliexpress');
  const contentCat = document.getElementById('tab-content-catalog');

  if (tabAli && tabCat && contentAli && contentCat) {
    tabAli.addEventListener('click', () => {
      contentAli.style.display = 'block';
      contentCat.style.display = 'none';
      tabAli.classList.add('active');
      tabCat.classList.remove('active');
    });
    tabCat.addEventListener('click', () => {
      contentAli.style.display = 'none';
      contentCat.style.display = 'block';
      tabCat.classList.add('active');
      tabAli.classList.remove('active');
    });
  }

  // Кнопка збору замовлень
  const scrapeBtn = document.getElementById('scrape-orders');
  if (scrapeBtn) {
    scrapeBtn.addEventListener('click', scrapeOrdersFromWebview);
  }

  // Слухаємо повідомлення з webview
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'ORDERS_DATA') {
      renderTable(event.data.orders);
    }
  });
});
