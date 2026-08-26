import { readFileSync, writeFileSync } from 'node:fs';

const NEX_NEW = '0xC30Fe7CCad56fE8470093798BB02ff5E3b2693fe';
const PS_NEW  = '0xB0169b1654bd41Fb34d0bf7c0cE11673040772df';

let html = readFileSync('../index.html', 'utf8');

// Find and replace all old addresses
const oldNex = ['0x65A56978A60733B28cD1FD61C760AB5dC8FD3081'];
const oldPs  = ['0x97fb5CEada36C721a4b82BF6a6ddFa565AC79ecF'];

let count = 0;
for (const old of oldNex) {
  while (html.includes(old)) {
    html = html.replace(old, NEX_NEW);
    count++;
  }
}
for (const old of oldPs) {
  while (html.includes(old)) {
    html = html.replace(old, PS_NEW);
    count++;
  }
}

writeFileSync('../index.html', html, 'utf8');
console.log('Replaced', count, 'addresses in index.html');
