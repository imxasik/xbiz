const $=id=>document.getElementById(id);
const money=n=>'৳'+new Intl.NumberFormat('en-US').format(Math.round(n));
const gbSlabs=[20,30,40,50,60,70,80,100], minSlabs=[100,200,300,400,500,800,1000,1500,2000];
function nearest(a,x){return a.reduce((p,v)=>Math.abs(v-x)<Math.abs(p-x)?v:p,a[0])}
function bnNum(s){return String(s).replace(/[০-৯]/g,d=>'০১২৩৪৫৬৭৮৯'.indexOf(d));}
function parseNeed(){
 let t=bnNum($('needText').value.toLowerCase()).replace(/,/g,'');
 let op=t.includes('airtel')||t.includes('এয়ারটেল')||t.includes('এয়ারটেল')?'Airtel':t.includes('robi')||t.includes('রবি')?'Robi':'';
 let gb=null,min=null,m=t.match(/(\d+(?:\.\d+)?)\s*(?:gb|g|জিবি|জিব|g b)/i),n=t.match(/(\d+(?:\.\d+)?)\s*(?:min|mins|minute|minutes|মিনিট|m)/i);
 if(m)gb=+m[1];if(n)min=+n[1];
 if(gb===null||min===null){let p=t.match(/(\d+(?:\.\d+)?)\s*\+\s*(\d+(?:\.\d+)?)/);if(p){gb=+p[1];min=+p[2]}}
 if(gb!==null&&min!==null){$('otpGB').value=gb;$('otpMin').value=min;$('operator').textContent=op||'OTP';$('parsedText').textContent='✓ '+(op?op+' ':'')+'OTP '+gb+' GB + '+min+' মিনিট শনাক্ত হয়েছে';calc()}else $('parsedText').textContent='⚠ GB ও মিনিট শনাক্ত করা যায়নি';
}
function calc(){
 const tg=+$('totalGB').value||0,tm=+$('totalMin').value||0,og=+$('otpGB').value||0,om=+$('otpMin').value||0,target=+$('target').value||0,mr=+$('otpMarket').value||0,dr=+$('distributionRate').value||0;
 const rg=Math.max(0,tg-og),rm=Math.max(0,tm-om),pg=rg/4,pm=rm/4,sg=nearest(gbSlabs,pg),sm=nearest(minSlabs,pm),four=dr*4,otp=target-four,diff=otp-mr;
 $('remain').textContent=rg+' GB + '+rm+' মিনিট';$('raw').textContent=pg+' GB + '+pm+' মিনিট';$('per').textContent=sg+' GB + '+sm+' মিনিট';
 $('four').textContent=money(four);$('otpRate').textContent=money(otp);$('mktOut').textContent=money(mr);$('targetRate').textContent=money(otp);
 $('diff').textContent=(diff>=0?'+':'−')+money(Math.abs(diff));$('sale').textContent=money(otp+four);
 const a=$('alert');if(otp<=0){a.textContent='⚠ এই Distribution Market Rate-এ Target অর্জন সম্ভব নয়';a.style.background='#fff1f2';a.style.color='#be123c'}else if(otp>mr){a.textContent='⚠ Target Rate Market Value-এর চেয়ে '+money(otp-mr)+' বেশি';a.style.background='#fff7ed';a.style.color='#c2410c'}else{a.textContent='✓ Market অনুযায়ী Target achievable';a.style.background='#ecfdf3';a.style.color='#15803d'}
}
document.querySelectorAll('input').forEach(x=>x.addEventListener('input',calc));$('parseBtn').addEventListener('click',parseNeed);$('needText').addEventListener('input',parseNeed);calc();
let d;addEventListener('beforeinstallprompt',e=>{e.preventDefault();d=e;$('install').hidden=false});$('install').onclick=()=>{if(d)d.prompt()};if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');