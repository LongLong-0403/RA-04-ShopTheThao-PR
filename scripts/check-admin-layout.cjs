const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
(async () => {
 const server = http.createServer((req,res) => {
  const file=path.join(process.cwd(),decodeURIComponent(req.url.split('?')[0]));
  if(!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404); return res.end();}
  res.setHeader('Content-Type',file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':file.endsWith('.html')?'text/html; charset=utf-8':'application/octet-stream');
  res.end(fs.readFileSync(file));
 }).listen(0,'127.0.0.1');
 await new Promise(r=>server.on('listening',r)); 
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try {
 const page=await browser.newPage();
 await page.route('**/*',route => route.request().url().startsWith('http://127.0.0.1:') ? route.continue() : route.abort());
 const base=`http://127.0.0.1:${server.address().port}/frontend/pages/`;
 const names=fs.readdirSync('frontend/pages').filter(n=>n.endsWith('.html')&&fs.readFileSync('frontend/pages/'+n,'utf8').includes('id="adminSidebar"'));
 for (const width of [390,768,1366]) {
  await page.setViewportSize({width,height:900});
  for (const name of names) {
   console.log('Checking',width,name); await page.goto(base+name,{waitUntil:'domcontentloaded'});
   await page.waitForSelector('#adminSidebar nav',{state:'attached'});
   assert.equal(await page.locator('#adminSidebar [aria-current="page"]').count(),1,name);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
   if(overflow) console.log('OVERFLOW',width,name,await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).slice(0,8).map(e=>e.tagName+'.'+e.className)));
   assert.equal(overflow,false,`${width} ${name} overflow`);
   for(const href of await page.locator('#adminSidebar a').evaluateAll(items=>items.map(a=>a.getAttribute('href')))) assert(fs.existsSync(path.resolve('frontend/pages',href)),href);
   if(width<1025){
    assert(await page.locator('#adminSidebar').evaluate(e=>e.inert));
    await page.click('#btnToggleAdminSidebar');
    assert.equal(await page.getAttribute('#btnToggleAdminSidebar','aria-expanded'),'true');
    await page.keyboard.press('Escape');
    assert.equal(await page.getAttribute('#btnToggleAdminSidebar','aria-expanded'),'false');
    await page.click('#btnToggleAdminSidebar');
    await page.click('#adminSidebarBackdrop',{position:{x:width-5,y:200}});
    assert.equal(await page.getAttribute('#btnToggleAdminSidebar','aria-expanded'),'false');
    await page.click('#btnToggleAdminSidebar');
    await page.click('#adminSidebar a[href="admin-guide.html"]');
    await page.waitForURL('**/admin-guide.html');
   }
   console.log('PASS',width,name);
  }
 }
 await page.setViewportSize({width:390,height:900});
 await page.goto(base+'admin-guide.html',{waitUntil:'domcontentloaded'});
 await page.click('#btnToggleAdminSidebar');
 await page.setViewportSize({width:1366,height:900});
 await page.waitForFunction(()=>document.body.style.overflow === '');
 assert.equal(await page.locator('#adminSidebar').evaluate(e=>e.inert),false);
 console.log('PASS resize mobile to desktop');
 } finally {await browser.close(); server.close();}
})().catch(e=>{console.error(e);process.exit(1)});

