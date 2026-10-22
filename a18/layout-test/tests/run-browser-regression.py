from pathlib import Path
from tempfile import TemporaryDirectory
import urllib.request,subprocess,json,base64,os,socket,struct,time,html
from urllib.parse import urlparse
CHROME=r'C:\Program Files\Google\Chrome\Application\chrome.exe'
URL='http://127.0.0.1:8770/a18/layout-test/tests/layout-smoke.html'
class WS:
 def __init__(self,url):
  p=urlparse(url);self.s=socket.create_connection((p.hostname,p.port),timeout=5);self.s.settimeout(6)
  key=base64.b64encode(os.urandom(16)).decode()
  headers=(f'GET {p.path} HTTP/1.1\r\nHost: {p.hostname}:{p.port}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Version: 13\r\nSec-WebSocket-Key: {key}\r\n\r\n').encode()
  self.s.sendall(headers);buf=b''
  while b'\r\n\r\n' not in buf:buf+=self.s.recv(4096)
  if b'101 WebSocket' not in buf:raise RuntimeError('WebSocket handshake: '+repr(buf[:250]))
  self.extra=buf.split(b'\r\n\r\n',1)[1];self.count=0
 def read(self,n):
  while len(self.extra)<n:self.extra+=self.s.recv(max(n-len(self.extra),4096))
  data=self.extra[:n];self.extra=self.extra[n:];return data
 def send(self,obj):
  data=json.dumps(obj).encode();mask=os.urandom(4);n=len(data)
  head=bytes([0x81,(0x80|n) if n<126 else (0x80|126 if n<65536 else 0x80|127)])
  if n>=65536:head+=struct.pack('!Q',n)
  elif n>=126:head+=struct.pack('!H',n)
  body=bytes(data[i]^mask[i%4] for i in range(n))
  self.s.sendall(head+mask+body)
 def recv(self):
  a,b=self.read(2);n=b&127
  if n==126:n=struct.unpack('!H',self.read(2))[0]
  elif n==127:n=struct.unpack('!Q',self.read(8))[0]
  mask=self.read(4) if b&128 else None
  dat=self.read(n)
  if mask:dat=bytes(dat[i]^mask[i%4] for i in range(n))
  if a&15==9:return None
  return json.loads(dat.decode())
 def call(self,method,params={}):
  self.count+=1;expected=self.count;self.send({'id':expected,'method':method,'params':params})
  while True:
   reply=self.recv()
   if reply and reply.get('id')==expected:
    if 'error' in reply:raise RuntimeError(str(reply['error']))
    return reply.get('result',{})
with TemporaryDirectory(prefix='a18-cdp-',ignore_cleanup_errors=True) as profile:
 command=[CHROME,'--headless=new','--no-sandbox','--disable-gpu','--no-first-run','--disable-extensions',
 '--disable-background-networking','--remote-allow-origins=*','--remote-debugging-port=9239','--user-data-dir='+profile,'about:blank']
 process=subprocess.Popen(command,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 try:
  start=time.time()
  while True:
   try:targets=json.load(urllib.request.urlopen('http://127.0.0.1:9239/json',timeout=2));break
   except Exception:
    if time.time()-start>12:raise RuntimeError('CDP unavailable')
    time.sleep(.3)
  page=next(x for x in targets if x['type']=='page')
  ws=WS(page['webSocketDebuggerUrl'])
  ws.call('Page.enable')
  ws.call('Runtime.enable')
  ws.call('Page.navigate',{'url':URL})
  start=time.time();last=''
  while time.time()-start<55:
   expr="({title:document.title,result:document.getElementById('result')?.textContent})"
   try:
    response=ws.call('Runtime.evaluate',{'expression':expr,'returnByValue':True})
    val=response.get('result',{}).get('value',{})
    if isinstance(val,dict):
     current=val.get('result','')
     if current!=last and current and current!='RUNNING':
      last=current
     if val.get('title') in ('A18 TEST PASSED','A18 TEST FAILED'):
      print('TITLE',val['title']);print(current)
      if val['title']=='A18 TEST FAILED':raise RuntimeError('Browser regression failed')
      break
   except RuntimeError as exc:
    if str(exc)=='Browser regression failed':raise
    print('POLL ERROR',type(exc).__name__,str(exc)[:300])
   except Exception as exc:print('POLL ERROR',type(exc).__name__,str(exc)[:300])
   time.sleep(.5)
  else:
   print('CDP TIMEOUT');print(last or 'No test result')
   x=ws.call('Runtime.evaluate',{'expression':"document.getElementById('game')?.contentWindow?.document.getElementById('hint')?.textContent",'returnByValue':True})
   print('HINT',x)
   raise TimeoutError('Browser regression timeout')
 finally:
  subprocess.run(['taskkill','/F','/T','/PID',str(process.pid)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
