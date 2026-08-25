import fs from 'node:fs';
const p = 'app/index.html';
let s = fs.readFileSync(p, 'utf8');
const start = s.indexOf('const REGISTRY');
if (start < 0) { console.log('anchor missing'); process.exit(1); }
const endLine = s.indexOf('\n', s.indexOf('AMOY_RPC', start));

const block = `/* ═══════════ MULTI-NETWORK (Amoy ⇄ BSC ⇄ Mainnet) ═══════════ */
const NETWORKS = {
  amoy:    { name:'Polygon Amoy',  rpc:'https://polygon-amoy.drpc.org',                  chainId:80002, sym:'POL',
             registry:'0x674d1b7b1c8FE6819AE7F22E6b46D8B02B7a8d32', splitter:'0x97fb5CEada36C721a4b82BF6a6ddFa565AC79ecF',
             nex:'0x999dec3a199335e0a83d0Dc03d8d0ABB48542035', job:'0xD6CA3267356f91E3c43097adf8F02caFa42D358A',
             presale:'0x8b6EC8d481A583d788B9C9d2c914E9bc0a220e24', usdt:'' },
  bsc:     { name:'BSC Testnet',   rpc:'https://data-seed-prebsc-1-s1.binance.org:8545', chainId:97,    sym:'tBNB',
             registry:'', splitter:'', nex:'', job:'', presale:'', usdt:'' },
  mainnet: { name:'Polygon Mainnet', rpc:'https://polygon-bor-rpc.publicnode.com',       chainId:137,   sym:'POL',
             registry:'', splitter:'', nex:'', job:'', presale:'',
             usdt:'0xc2132D05D31c914a87C6611C10748AEb04B58e8F' },
};
let g_net = localStorage.getItem('nx_net') || 'amoy';
if(!NETWORKS[g_net]) g_net='amoy';
function NET(){ return NETWORKS[g_net]; }
function switchNet(v){ localStorage.setItem('nx_net',v); location.reload(); }

const REGISTRY = NET().registry;
const SPLITTER = NET().splitter;
const AMOY_RPC = NET().rpc;`;

s = s.slice(0, start) + block + s.slice(endLine);
fs.writeFileSync(p, s);
console.log('networks block spliced ✓');
